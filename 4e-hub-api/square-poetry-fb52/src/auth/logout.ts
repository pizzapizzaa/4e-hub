import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { hashToken } from '../lib/jwt.ts';

export async function handleLogout(request: Request, env: Env): Promise<Response> {
	let body: { refreshToken?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const incomingToken = typeof body.refreshToken === 'string' ? body.refreshToken : null;
	if (!incomingToken) return err('refreshToken is required', 400, request);

	const tokenHash = await hashToken(incomingToken);
	const db = getTursoClient(env);

	await db.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);

	return json({ ok: true }, 200, request);
}
