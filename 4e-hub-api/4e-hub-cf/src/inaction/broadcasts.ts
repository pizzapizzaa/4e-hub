import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

function nowIso() { return new Date().toISOString(); }

export async function handleGetBroadcasts(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const { searchParams } = new URL(request.url);
  const teacherId = searchParams.get('teacherId');

  const db = getTursoClient(env);
  let rows;
  if (teacherId) {
    ({ rows } = await db.execute('SELECT * FROM broadcast_sessions WHERE teacher_id = ? ORDER BY started_at DESC', [teacherId]));
  } else if (auth.role === 'teacher') {
    ({ rows } = await db.execute('SELECT * FROM broadcast_sessions WHERE teacher_id = ? ORDER BY started_at DESC', [(auth as any).teacherId]));
  } else {
    ({ rows } = await db.execute('SELECT * FROM broadcast_sessions ORDER BY started_at DESC'));
  }

  const sessions = rows.map(r => ({
    id: r.id,
    teacherId: r.teacher_id,
    schoolId: r.school_id,
    classId: r.class_id,
    videoUrl: r.video_url,
    isLive: !!r.is_live,
    liveblocksRoomId: r.liveblocks_room_id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? null,
  }));

  return json(sessions, 200, request);
}

export async function handleStartBroadcast(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const body = await request.json().catch(() => ({}));
  const { classId, videoUrl, liveblocksRoomId } = body;
  if (!classId || !videoUrl) return err('classId and videoUrl required', 400, request);

  // teacher id resolved from auth if not provided
  const teacherId = auth.role === 'teacher' ? (auth as any).teacherId : body.teacherId;
  if (!teacherId) return err('teacherId required', 400, request);
  if (auth.role === 'teacher' && teacherId !== (auth as any).teacherId) return err('Forbidden', 403, request);

  const id = `b-${Math.floor(Math.random() * 900000 + 100000)}`;
  const startedAt = nowIso();
  const roomId = liveblocksRoomId ?? `room-${Math.floor(Math.random() * 1000000)}`;

  const db = getTursoClient(env);
  await db.execute(
    'INSERT INTO broadcast_sessions (id, teacher_id, school_id, class_id, video_url, is_live, liveblocks_room_id, started_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, teacherId, auth.schoolId, classId, videoUrl, 1, roomId, startedAt],
  );

  return json({ id, startedAt, liveblocksRoomId: roomId }, 201, request);
}

export async function handleEndBroadcast(request: Request, env: Env, sessionId: string): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT * FROM broadcast_sessions WHERE id = ?', [sessionId]);
  if (rows.length === 0) return err('Not found', 404, request);
  const session = rows[0];
  if (auth.role === 'teacher' && (auth as any).teacherId !== session.teacher_id) return err('Forbidden', 403, request);

  const endedAt = nowIso();
  await db.execute('UPDATE broadcast_sessions SET is_live = 0, ended_at = ? WHERE id = ?', [endedAt, sessionId]);

  return json({ id: sessionId, endedAt }, 200, request);
}
