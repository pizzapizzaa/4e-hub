import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleGetLearners(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	const { searchParams } = new URL(request.url);
	const schoolId = searchParams.get('schoolId');

	const effectiveSchoolId =
		auth.role === 'school_admin' ? auth.schoolId : (schoolId ?? null);

	const db = getTursoClient(env);
	let rows;

	if (effectiveSchoolId) {
		({ rows } = await db.execute(
			'SELECT * FROM students WHERE school_id = ? ORDER BY id',
			[effectiveSchoolId],
		));
	} else {
		({ rows } = await db.execute('SELECT * FROM students ORDER BY id'));
	}

	const learners = rows.map(r => ({
		id:             r.id,
		userId:         r.user_id,
		schoolId:       r.school_id,
		classIds:       [],   // students table doesn't store class_ids directly
		graduationYear: r.graduation_year,
		learningPathId: r.learning_path_id ?? undefined,
		guardianIds:    JSON.parse(r.guardian_ids as string ?? '[]'),
	}));

	return json(learners, 200, request);
}
