import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES  = new Set(['super_admin', 'district_admin', 'school_admin']);
const CREATE_ROLES = new Set(['super_admin', 'district_admin']);

const VALID_SUBJECTS = new Set(['english', 'maths', 'science', 'bouldering']);
const VALID_METHODS  = new Set(['direct_instruction', 'inquiry_based', 'flipped_classroom', 'blended']);

export async function handleGetPrograms(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	const db = getTursoClient(env);
	let rows;

	if (auth.role === 'super_admin' || auth.role === 'district_admin') {
		({ rows } = await db.execute('SELECT * FROM programs ORDER BY name'));
	} else {
		// school_admin — only programs linked to their school (JSON array search)
		({ rows } = await db.execute(
			`SELECT p.* FROM programs p, json_each(p.school_ids) je WHERE je.value = ? ORDER BY p.name`,
			[auth.schoolId],
		));
	}

	const programs = rows.map(r => ({
		id:              r.id,
		name:            r.name,
		subject:         r.subject,
		level:           r.level,
		description:     r.description ?? '',
		materialSources: JSON.parse(r.material_sources as string ?? '[]'),
		teachingMethod:  r.teaching_method,
		isActive:        r.is_active === 1,
		schoolIds:       JSON.parse(r.school_ids as string ?? '[]'),
		createdAt:       r.created_at,
	}));

	return json(programs, 200, request);
}

export async function handleCreateProgram(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!CREATE_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	let body: { name?: unknown; subject?: unknown; level?: unknown; description?: unknown; teachingMethod?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const name           = typeof body.name === 'string'           ? body.name.trim()           : null;
	const subject        = typeof body.subject === 'string'        ? body.subject.trim()        : null;
	const level          = typeof body.level === 'string'          ? body.level.trim()          : null;
	const description    = typeof body.description === 'string'    ? body.description.trim()    : '';
	const teachingMethod = typeof body.teachingMethod === 'string' ? body.teachingMethod.trim() : null;

	if (!name)                                return err('name is required', 400, request);
	if (!subject || !VALID_SUBJECTS.has(subject)) return err('subject must be english, maths, science, or bouldering', 400, request);
	if (!level)                               return err('level is required', 400, request);
	if (!teachingMethod || !VALID_METHODS.has(teachingMethod)) return err('invalid teachingMethod', 400, request);

	const id        = crypto.randomUUID();
	const createdAt = new Date().toISOString();

	const db = getTursoClient(env);
	await db.execute(
		'INSERT INTO programs (id, name, subject, level, description, material_sources, teaching_method, is_active, school_ids, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
		[id, name, subject, level, description, subject === 'bouldering' ? '["youtube"]' : '[]', teachingMethod, 1, '[]', createdAt],
	);

	return json({
		id, name, subject, level, description,
		materialSources: subject === 'bouldering' ? ['youtube'] : [],
		teachingMethod,
		isActive: true,
		schoolIds: [],
		createdAt,
	}, 201, request);
}
