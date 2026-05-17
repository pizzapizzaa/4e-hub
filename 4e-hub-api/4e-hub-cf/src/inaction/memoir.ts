import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

function nowIso() { return new Date().toISOString(); }

export async function handleGetMemoirs(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const teacherIdParam = searchParams.get('teacherId');
  const studentId = searchParams.get('studentId');

  const teacherId = auth.role === 'teacher' ? (auth as any).teacherId ?? teacherIdParam : teacherIdParam;
  if (!teacherId) return err('teacherId required', 400, request);
  if (auth.role === 'teacher' && teacherId !== (auth as any).teacherId) return err('Forbidden', 403, request);

  const db = getTursoClient(env);
  let rows;
  if (studentId) {
    ({ rows } = await db.execute('SELECT * FROM teacher_memoir WHERE teacher_id = ? AND student_id = ? ORDER BY created_at DESC', [teacherId, studentId]));
  } else {
    ({ rows } = await db.execute('SELECT * FROM teacher_memoir WHERE teacher_id = ? ORDER BY created_at DESC', [teacherId]));
  }

  const entries = rows.map(r => ({
    id: r.id,
    teacherId: r.teacher_id,
    studentId: r.student_id,
    schoolId: r.school_id,
    classId: r.class_id,
    note: r.note,
    tags: JSON.parse(r.tags as string ?? '[]'),
    isPrivate: !!r.is_private,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return json(entries, 200, request);
}

export async function handleCreateMemoir(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => ({}));
  const { teacherId, studentId, classId, note, tags = [], isPrivate = true } = body;
  if (!teacherId || !studentId || !classId || !note) return err('missing fields', 400, request);
  if (auth.role === 'teacher' && teacherId !== (auth as any).teacherId) return err('Forbidden', 403, request);

  const id = `m-${Math.floor(Math.random() * 900000 + 100000)}`;
  const ts = nowIso();
  const db = getTursoClient(env);
  await db.execute(
    'INSERT INTO teacher_memoir (id, teacher_id, student_id, school_id, class_id, note, tags, is_private, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, teacherId, studentId, auth.schoolId, classId, note, JSON.stringify(tags), isPrivate ? 1 : 0, ts, ts],
  );

  return json({ id, createdAt: ts }, 201, request);
}

export async function handleUpdateMemoir(request: Request, env: Env, memoirId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => ({}));
  const { note, tags, isPrivate } = body;
  if (!note && !tags && typeof isPrivate === 'undefined') return err('nothing to update', 400, request);

  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT * FROM teacher_memoir WHERE id = ?', [memoirId]);
  if (rows.length === 0) return err('Not found', 404, request);
  const existing = rows[0];
  if (auth.role === 'teacher' && (auth as any).teacherId !== existing.teacher_id) return err('Forbidden', 403, request);

  const updatedAt = nowIso();
  const updates: string[] = [];
  const args: any[] = [];
  if (note) { updates.push('note = ?'); args.push(note); }
  if (tags) { updates.push('tags = ?'); args.push(JSON.stringify(tags)); }
  if (typeof isPrivate !== 'undefined') { updates.push('is_private = ?'); args.push(isPrivate ? 1 : 0); }
  updates.push('updated_at = ?'); args.push(updatedAt);

  args.push(memoirId);
  await db.execute(`UPDATE teacher_memoir SET ${updates.join(', ')} WHERE id = ?`, args);

  return json({ id: memoirId, updatedAt }, 200, request);
}
