import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
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
