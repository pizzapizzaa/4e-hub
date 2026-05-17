import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

export async function handleGetTeacherClasses(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const teacherIdParam = searchParams.get('teacherId');

  // If caller is a teacher, default to their own teacherId when not provided
  const teacherId = auth.role === 'teacher' ? (auth as any).teacherId ?? teacherIdParam : teacherIdParam;
  if (!teacherId) return err('teacherId required', 400, request);

  // school_admin / district_admin may query any teacher in their scope; teacher only their own
  if (auth.role === 'teacher' && teacherId !== (auth as any).teacherId) return err('Forbidden', 403, request);

  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT * FROM classes WHERE teacher_id = ? ORDER BY id', [teacherId]);

  const classes = rows.map(r => ({
    id: r.id,
    schoolId: r.school_id,
    teacherId: r.teacher_id,
    name: r.name,
    subject: r.subject,
    studentIds: JSON.parse(r.student_ids as string ?? '[]'),
    programId: r.program_id,
    academicYear: r.academic_year,
  }));

  return json(classes, 200, request);
}

export async function handleGetClass(request: Request, env: Env, classId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
  if (rows.length === 0) return err('Not found', 404, request);
  const r = rows[0];

  // If caller is teacher, ensure they own the class
  if (auth.role === 'teacher' && (auth as any).teacherId !== r.teacher_id) return err('Forbidden', 403, request);

  const cls = {
    id: r.id,
    schoolId: r.school_id,
    teacherId: r.teacher_id,
    name: r.name,
    subject: r.subject,
    studentIds: JSON.parse(r.student_ids as string ?? '[]'),
    programId: r.program_id,
    academicYear: r.academic_year,
  };

  return json(cls, 200, request);
}

export async function handleGetClassStudents(request: Request, env: Env, classId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  // If teacher, ensure they own the class
  const db = getTursoClient(env);
  const { rows: classRows } = await db.execute('SELECT * FROM classes WHERE id = ?', [classId]);
  if (classRows.length === 0) return err('Not found', 404, request);
  const cls = classRows[0];
  if (auth.role === 'teacher' && (auth as any).teacherId !== cls.teacher_id) return err('Forbidden', 403, request);

  // students.class_ids is stored as JSON text — use LIKE to match class id
  const like = `%"${classId}"%`;
  const { rows } = await db.execute('SELECT * FROM students WHERE class_ids LIKE ? ORDER BY id', [like]);

  const students = rows.map(r => ({
    id: r.id,
    userId: r.user_id,
    schoolId: r.school_id,
    classIds: JSON.parse(r.class_ids as string ?? '[]'),
    graduationYear: r.graduation_year,
  }));

  return json(students, 200, request);
}
