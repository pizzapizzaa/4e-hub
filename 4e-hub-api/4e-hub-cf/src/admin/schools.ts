import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);
const CREATE_ROLES = new Set(['super_admin', 'district_admin']);

export async function handleGetSchools(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	const db = getTursoClient(env);
	let rows;

	if (auth.role === 'super_admin') {
		({ rows } = await db.execute('SELECT * FROM schools ORDER BY name'));
	} else if (auth.role === 'district_admin') {
		({ rows } = await db.execute(
			'SELECT * FROM schools WHERE district_id = ? ORDER BY name',
			[auth.districtId],
		));
	} else {
		// school_admin — only their own school
		({ rows } = await db.execute(
			'SELECT * FROM schools WHERE id = ?',
			[auth.schoolId],
		));
	}

	const schools = rows.map(r => ({
		id:           r.id,
		districtId:   r.district_id,
		name:         r.name,
		address:      r.address ?? '',
		adminIds:     JSON.parse(r.admin_ids as string ?? '[]'),
		teacherCount: r.teacher_count ?? 0,
		studentCount: r.student_count ?? 0,
		isActive:     r.is_active === 1,
		createdAt:    r.created_at,
	}));

	return json(schools, 200, request);
}

export async function handleGetSchool(request: Request, env: Env, id: string): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	// school_admin can only view their own school
	if (auth.role === 'school_admin' && auth.schoolId !== id) return err('Forbidden', 403, request);

	const db = getTursoClient(env);
	const { rows } = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
	if (!rows[0]) return err('School not found', 404, request);
	const r = rows[0];

	return json({
		id:           r.id,
		districtId:   r.district_id,
		name:         r.name,
		address:      r.address ?? '',
		adminIds:     JSON.parse(r.admin_ids as string ?? '[]'),
		teacherCount: r.teacher_count ?? 0,
		studentCount: r.student_count ?? 0,
		isActive:     r.is_active === 1,
		createdAt:    r.created_at,
	}, 200, request);
}

export async function handleCreateSchool(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!CREATE_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	let body: { name?: unknown; address?: unknown; districtId?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const name       = typeof body.name === 'string'       ? body.name.trim()       : null;
	const address    = typeof body.address === 'string'    ? body.address.trim()    : '';
	const districtId = typeof body.districtId === 'string' ? body.districtId.trim() : null;

	if (!name)       return err('name is required', 400, request);
	if (!districtId) return err('districtId is required', 400, request);

	const id        = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	const db = getTursoClient(env);
	await db.execute(
		'INSERT INTO schools (id, district_id, name, address, admin_ids, teacher_count, student_count, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[id, districtId, name, address, '[]', 0, 0, 1, createdAt],
	);

	return json({
		id,
		districtId,
		name,
		address,
		adminIds:     [],
		teacherCount: 0,
		studentCount: 0,
		isActive:     true,
		createdAt,
	}, 201, request);
}

export async function handleUpdateSchool(request: Request, env: Env, id: string): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	// Only super_admins may update schools
	if (auth.role !== 'super_admin') return err('Forbidden', 403, request);

	let body: { name?: unknown; address?: unknown; districtId?: unknown; isActive?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const name       = typeof body.name === 'string'       ? body.name.trim()       : null;
	const address    = typeof body.address === 'string'    ? body.address.trim()    : null;
	const districtId = typeof body.districtId === 'string' ? body.districtId.trim() : null;
	const isActive   = typeof body.isActive === 'boolean'  ? (body.isActive ? 1 : 0) : null;

	if (!name)       return err('name is required', 400, request);
	if (!districtId) return err('districtId is required', 400, request);

	const db = getTursoClient(env);
	// Update fields provided
	await db.execute(
		'UPDATE schools SET name = ?, address = ?, district_id = ?, is_active = ? WHERE id = ?',
		[name, address ?? '', districtId, isActive ?? 1, id],
	);

	// Return updated school
	const { rows } = await db.execute('SELECT * FROM schools WHERE id = ?', [id]);
	if (!rows[0]) return err('School not found', 404, request);
	const r = rows[0];

	return json({
		id:           r.id,
		districtId:   r.district_id,
		name:         r.name,
		address:      r.address ?? '',
		adminIds:     JSON.parse(r.admin_ids as string ?? '[]'),
		teacherCount: r.teacher_count ?? 0,
		studentCount: r.student_count ?? 0,
		isActive:     r.is_active === 1,
		createdAt:    r.created_at,
	}, 200, request);
}
