import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleGetPrograms(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	const db = getTursoClient(env);
	let rows;

	if (auth.role === 'super_admin' || auth.role === 'district_admin') {
		({ rows } = await db.execute('SELECT * FROM programs ORDER BY name'));
	} else {
		// school_admin — only programs linked to their school
		({ rows } = await db.execute(
			"SELECT * FROM programs WHERE json_each.value = ? ORDER BY name",
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
