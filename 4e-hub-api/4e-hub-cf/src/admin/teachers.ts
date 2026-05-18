import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { hashPassword } from '../lib/password.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleGetTeachers(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	const { searchParams } = new URL(request.url);
	const schoolId = searchParams.get('schoolId');

	// school_admin can only see their own school's teachers
	const effectiveSchoolId =
		auth.role === 'school_admin' ? auth.schoolId : (schoolId ?? null);

	const db = getTursoClient(env);
	let rows;

	if (effectiveSchoolId) {
		({ rows } = await db.execute(
			'SELECT * FROM teachers WHERE school_id = ? ORDER BY id',
			[effectiveSchoolId],
		));
	} else {
		({ rows } = await db.execute('SELECT * FROM teachers ORDER BY id'));
	}

	const teachers = rows.map(r => ({
		id:             r.id,
		userId:         r.user_id,
		schoolId:       r.school_id,
		classIds:       JSON.parse(r.class_ids as string ?? '[]'),
		subjectAreas:   JSON.parse(r.subject_areas as string ?? '[]'),
		qualifications: r.qualifications ?? undefined,
	}));

	return json(teachers, 200, request);
}

const CREATE_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleCreateTeacher(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!CREATE_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	let body: { fullName?: unknown; email?: unknown; password?: unknown; schoolId?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	// Accept either a single schoolId or an array of schoolIds for multi-school assignment
	const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : null;
	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
	const password = typeof body.password === 'string' ? body.password : null;
	const schoolId = typeof (body as any).schoolId === 'string' ? (body as any).schoolId : null;
	const schoolIds = Array.isArray((body as any).schoolIds) ? (body as any).schoolIds as string[] : (schoolId ? [schoolId] : []);

	if (!fullName) return err('fullName is required', 400, request);
	if (!email) return err('email is required', 400, request);
	if (!password) return err('password is required', 400, request);
	if (schoolIds.length === 0) return err('schoolIds is required', 400, request);

	const [firstName, ...rest] = fullName.split(' ');
	const lastName = rest.join(' ') || '';

	const db = getTursoClient(env);

	// Validate all schoolIds exist and are within caller scope
	for (const sid of schoolIds) {
		const { rows: srows } = await db.execute('SELECT * FROM schools WHERE id = ?', [sid]);
		if (!srows[0]) return err(`School not found: ${sid}`, 404, request);
		const srow = srows[0];
		if (auth.role === 'school_admin' && auth.schoolId !== sid) return err('Forbidden', 403, request);
		if (auth.role === 'district_admin' && auth.districtId !== srow.district_id) return err('Forbidden', 403, request);
	}

	const userId = crypto.randomUUID();
	const teacherId = crypto.randomUUID();
	const createdAt = new Date().toISOString();
	const passwordHash = hashPassword(password);

	// Primary school is the first in the list for compatibility with existing fields
	const primarySchool = schoolIds[0];

	// Insert user (user.school_id = primarySchool)
	await db.execute(
		'INSERT INTO users (id, email, password_hash, role, school_id, district_id, tenant_id, first_name, last_name, avatar_url, graduation_year, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[userId, email, passwordHash, 'teacher', primarySchool, (await db.execute('SELECT district_id FROM schools WHERE id = ?', [primarySchool])).rows[0].district_id, auth.tenantId ?? (await db.execute('SELECT district_id FROM schools WHERE id = ?', [primarySchool])).rows[0].district_id, firstName, lastName, null, null, 1, createdAt],
	);

	// Insert teacher record — include school_ids JSON for multi-school support when available,
	// otherwise fall back to existing schema (school_id only).
	const { rows: pragmaRows } = await db.execute("PRAGMA table_info('teachers')");
	const hasSchoolIds = pragmaRows.some((r: any) => r.name === 'school_ids');
	if (hasSchoolIds) {
		await db.execute(
			'INSERT INTO teachers (id, user_id, school_id, class_ids, subject_areas, qualifications, created_at, school_ids) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
			[teacherId, userId, primarySchool, '[]', '[]', null, createdAt, JSON.stringify(schoolIds)],
		);
	} else {
		await db.execute(
			'INSERT INTO teachers (id, user_id, school_id, class_ids, subject_areas, qualifications, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
			[teacherId, userId, primarySchool, '[]', '[]', null, createdAt],
		);
	}

	// Increment teacher_count on each school
	for (const sid of schoolIds) {
		await db.execute('UPDATE schools SET teacher_count = IFNULL(teacher_count,0) + 1 WHERE id = ?', [sid]);
	}

	return json({ id: teacherId, userId, email, firstName, lastName, schoolIds, createdAt }, 201, request);
}

export async function handleUpdateTeacher(request: Request, env: Env, id: string): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	// Only super_admins may update teacher profiles
	if (auth.role !== 'super_admin') return err('Forbidden', 403, request);

	let body: { fullName?: unknown; email?: unknown; schoolIds?: unknown; subjectAreas?: unknown; qualifications?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const db = getTursoClient(env);
	const { rows: tr } = await db.execute('SELECT * FROM teachers WHERE id = ?', [id]);
	if (!tr[0]) return err('Teacher not found', 404, request);
	const trow = tr[0];

	// Gather current state
	const { rows: pragmaRows } = await db.execute("PRAGMA table_info('teachers')");
	const hasSchoolIds = pragmaRows.some((r: any) => r.name === 'school_ids');
	let currentSchoolIds: string[] = [];
	if (hasSchoolIds) {
		try { currentSchoolIds = JSON.parse(trow.school_ids as string ?? '[]'); } catch { currentSchoolIds = []; }
	} else {
		currentSchoolIds = [trow.school_id];
	}

	// Prepare updates
	const updates: string[] = [];
	const args: any[] = [];

	if (typeof body.qualifications === 'string') {
		updates.push('qualifications = ?'); args.push(body.qualifications);
	}
	if (Array.isArray(body.subjectAreas)) {
		updates.push('subject_areas = ?'); args.push(JSON.stringify(body.subjectAreas));
	}
	let newSchoolIds = currentSchoolIds.slice();
	if (Array.isArray(body.schoolIds)) {
		newSchoolIds = (body.schoolIds as any[]).map(String);
		if (hasSchoolIds) {
			updates.push('school_ids = ?'); args.push(JSON.stringify(newSchoolIds));
		}
		// update primary school column as first
		updates.push('school_id = ?'); args.push(newSchoolIds[0] ?? currentSchoolIds[0]);
	}

	// Apply teacher updates
	if (updates.length > 0) {
		await db.execute(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`, [...args, id]);
	}

	// If email or fullName provided, update users table linked to this teacher
	if (typeof body.email === 'string' || typeof body.fullName === 'string') {
		const userId = trow.user_id as string;
		const uUpdates: string[] = [];
		const uArgs: any[] = [];
		if (typeof body.email === 'string') { uUpdates.push('email = ?'); uArgs.push((body.email as string).trim().toLowerCase()); }
		if (typeof body.fullName === 'string') {
			const [firstName, ...rest] = (body.fullName as string).trim().split(' ');
			const lastName = rest.join(' ') || '';
			uUpdates.push('first_name = ?'); uArgs.push(firstName);
			uUpdates.push('last_name = ?'); uArgs.push(lastName);
		}
		if (uUpdates.length > 0) {
			await db.execute(`UPDATE users SET ${uUpdates.join(', ')} WHERE id = ?`, [...uArgs, userId]);
		}
	}

	// Adjust teacher_count for schools if changed
	const removed = currentSchoolIds.filter(s => !newSchoolIds.includes(s));
	const added = newSchoolIds.filter(s => !currentSchoolIds.includes(s));
	for (const sid of removed) {
		await db.execute('UPDATE schools SET teacher_count = IFNULL(teacher_count,0) - 1 WHERE id = ?', [sid]);
	}
	for (const sid of added) {
		await db.execute('UPDATE schools SET teacher_count = IFNULL(teacher_count,0) + 1 WHERE id = ?', [sid]);
	}

	// Return updated teacher
	const { rows: updated } = await db.execute('SELECT * FROM teachers WHERE id = ?', [id]);
	const r = updated[0];
	return json({
		id: r.id,
		userId: r.user_id,
		schoolId: r.school_id,
		classIds: JSON.parse(r.class_ids as string ?? '[]'),
		subjectAreas: JSON.parse(r.subject_areas as string ?? '[]'),
		qualifications: r.qualifications ?? undefined,
		schoolIds: hasSchoolIds ? JSON.parse(r.school_ids as string ?? '[]') : undefined,
	}, 200, request);
}
