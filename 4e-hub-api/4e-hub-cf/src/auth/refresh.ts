import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { generateToken, hashToken, signJwt, type JwtPayload } from '../lib/jwt.ts';

const ACCESS_TOKEN_TTL  = 60 * 60;            // 1 hour
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days

export async function handleRefresh(request: Request, env: Env): Promise<Response> {
	// ── Rate limit by IP (10 req / 60 s) ─────────────────────────────────────
	if (env.RATE_LIMITER) {
		const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
		const { success } = await env.RATE_LIMITER.limit({ key: `refresh:${ip}` });
		if (!success) return err('Too many requests. Please slow down.', 429, request);
	}

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

	// Look up the hashed token
	const { rows } = await db.execute(
		`SELECT rt.id, rt.user_id, rt.expires_at,
		        u.email, u.role, u.school_id, u.district_id, u.tenant_id,
		        u.first_name, u.last_name, u.is_active
		 FROM refresh_tokens rt
		 JOIN users u ON u.id = rt.user_id
		 WHERE rt.token_hash = ?`,
		[tokenHash],
	);

	const row = rows[0];

	if (!row || row.is_active === 0) {
		return err('Invalid or expired refresh token', 401, request);
	}

	// Check expiry
	if (new Date(row.expires_at as string) < new Date()) {
		await db.execute('DELETE FROM refresh_tokens WHERE id = ?', [row.id as string]);
		return err('Refresh token expired. Please log in again.', 401, request);
	}

	// Rotate: delete old token and insert new one atomically in a single batch
	const newRefreshToken = generateToken();
	const newTokenHash    = await hashToken(newRefreshToken);
	const newExpiresAt    = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString();
	const newTokenId      = crypto.randomUUID();

	await db.batch([
		{ sql: 'DELETE FROM refresh_tokens WHERE id = ?', args: [row.id as string] },
		{
			sql: 'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
			args: [newTokenId, row.user_id as string, newTokenHash, newExpiresAt, new Date().toISOString()],
		},
	]);

	// Issue new access token
	const now = Math.floor(Date.now() / 1000);
	const payload: JwtPayload = {
		sub: row.user_id as string,
		email: row.email as string,
		role: row.role as string,
		schoolId: row.school_id as string,
		districtId: row.district_id as string,
		tenantId: row.tenant_id as string,
		firstName: row.first_name as string,
		lastName: row.last_name as string,
		iat: now,
		exp: now + ACCESS_TOKEN_TTL,
	};

	const accessToken = await signJwt(payload, env.JWT_SECRET);

	return json({ accessToken, refreshToken: newRefreshToken, expiresAt: payload.exp }, 200, request);
}
