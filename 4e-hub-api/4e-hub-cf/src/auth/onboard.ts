import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { signJwt, verifyJwt } from '../lib/jwt.ts';
import { hashPassword } from '../lib/password.ts';
import { requireAuth } from '../lib/require-auth.ts';

const CREATE_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleGenerateOnboarding(request: Request, env: Env): Promise<Response> {
  const auth = await requireAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!CREATE_ROLES.has(auth.role)) return err('Forbidden', 403, request);

  let body: { userId?: unknown; email?: unknown };
  try { body = (await request.json()) as typeof body; } catch { return err('Invalid JSON body', 400, request); }

  const db = getTursoClient(env);
  let userId: string | null = null;
  if (typeof body.userId === 'string') {
    userId = body.userId;
    const { rows } = await db.execute('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (!rows[0]) return err('User not found', 404, request);
  } else if (typeof body.email === 'string') {
    const email = body.email.trim().toLowerCase();
    const { rows } = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows[0]) return err('User not found', 404, request);
    userId = rows[0].id as string;
  } else {
    return err('userId or email required', 400, request);
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: userId, iat: now, exp: now + 24 * 60 * 60 } as any;
  const token = await signJwt(payload, env.JWT_SECRET);

  // Return token — caller (admin UI) can embed into onboarding email or copy link
  return json({ token }, 200, request);
}

export async function handleSetOnboardPassword(request: Request, env: Env): Promise<Response> {
  let body: { token?: unknown; password?: unknown };
  try { body = (await request.json()) as typeof body; } catch { return err('Invalid JSON body', 400, request); }

  const token = typeof body.token === 'string' ? body.token : null;
  const password = typeof body.password === 'string' ? body.password : null;
  if (!token || !password) return err('token and password required', 400, request);

  const payload = await verifyJwt(token, env.JWT_SECRET as string);
  if (!payload || !payload.sub) return err('Invalid or expired token', 401, request);

  const userId = payload.sub;
  const db = getTursoClient(env);
  const { rows } = await db.execute('SELECT id FROM users WHERE id = ?', [userId]);
  if (!rows[0]) return err('User not found', 404, request);

  const passwordHash = hashPassword(password);
  await db.execute('UPDATE users SET password_hash = ?, is_active = 1 WHERE id = ?', [passwordHash, userId]);

  return json({ ok: true }, 200, request);
}
