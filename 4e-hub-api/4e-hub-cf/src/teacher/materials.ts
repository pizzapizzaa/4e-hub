import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

export async function handleGetTeacherMaterials(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  const db = getTursoClient(env);
  if (auth.role === 'teacher') {
    const { rows } = await db.execute('SELECT materials FROM teachers WHERE user_id = ?', [auth.userId]);
    const materials = rows[0] ? JSON.parse(rows[0].materials as string ?? '[]') : [];
    return json(materials, 200, request);
  }

  // Admins may request teacher materials by ?teacherId=...
  if (auth.role === 'super_admin' || auth.role === 'district_admin' || auth.role === 'school_admin') {
    const url = new URL(request.url);
    const tid = url.searchParams.get('teacherId');
    if (!tid) return err('teacherId required', 400, request);
    const { rows } = await db.execute('SELECT materials FROM teachers WHERE id = ?', [tid]);
    const materials = rows[0] ? JSON.parse(rows[0].materials as string ?? '[]') : [];
    return json(materials, 200, request);
  }

  return err('Forbidden', 403, request);
}

export async function handleAddTeacherMaterial(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;

  let body: { title?: unknown; url?: unknown; type?: unknown };
  try { body = (await request.json()) as typeof body; } catch { return err('Invalid JSON', 400, request); }

  const title = typeof body.title === 'string' ? body.title.trim() : null;
  const url = typeof body.url === 'string' ? body.url.trim() : null;
  const type = typeof body.type === 'string' ? body.type : 'link';
  if (!title || !url) return err('title and url required', 400, request);

  const db = getTursoClient(env);
  if (auth.role === 'teacher') {
    // append to this teacher's materials
    const { rows } = await db.execute('SELECT materials FROM teachers WHERE user_id = ?', [auth.userId]);
    const current: any[] = rows[0] ? JSON.parse(rows[0].materials as string ?? '[]') : [];
    const item = { id: crypto.randomUUID(), title, url, type, createdAt: new Date().toISOString() };
    current.push(item);
    await db.execute('UPDATE teachers SET materials = ? WHERE user_id = ?', [JSON.stringify(current), auth.userId]);
    return json(item, 201, request);
  }

  return err('Forbidden', 403, request);
}
