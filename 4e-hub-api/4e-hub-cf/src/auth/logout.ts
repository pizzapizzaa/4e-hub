import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { hashToken, verifyJwt } from '../lib/jwt.ts';

export async function handleLogout(request: Request, env: Env): Promise<Response> {
	// Require a valid access token so only the authentic session owner can log out.
	const authHeader = request.headers.get('Authorization');
	const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!bearer) return err('Authorization header required', 401, request);

	const payload = await verifyJwt(bearer, env.JWT_SECRET);
	if (!payload) return err('Invalid or expired access token', 401, request);

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

	// Delete only refresh tokens that belong to the authenticated user (prevents
	// one user from logging out another by guessing a refresh token string).
	await db.execute(
		'DELETE FROM refresh_tokens WHERE token_hash = ? AND user_id = ?',
		[tokenHash, payload.sub],
	);

	return json({ ok: true }, 200, request);
}
