import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

export async function handleGetStudent(request: Request, env: Env, studentId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT * FROM students WHERE id = ?', [studentId]);
  if (rows.length === 0) return err('Not found', 404, request);
  const r = rows[0];

  // Teachers may only access students in their school; if needed, further restrict by class
  if (auth.role === 'teacher' && auth.schoolId !== r.school_id) return err('Forbidden', 403, request);

  const student = {
    id: r.id,
    userId: r.user_id,
    schoolId: r.school_id,
    classIds: JSON.parse(r.class_ids as string ?? '[]'),
    graduationYear: r.graduation_year,
    guardianIds: JSON.parse(r.guardian_ids as string ?? '[]'),
  };

  return json(student, 200, request);
}
