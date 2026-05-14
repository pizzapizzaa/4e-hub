import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { generateToken, hashToken, signJwt, type JwtPayload } from '../lib/jwt.ts';
import { verifyPassword } from '../lib/password.ts';

const ACCESS_TOKEN_TTL = 24 * 60 * 60;        // 24 hours
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 30 days

export async function handleLogin(request: Request, env: Env): Promise<Response> {
	let body: { email?: unknown; password?: unknown };
	try {
		body = (await request.json()) as typeof body;
	} catch {
		return err('Invalid JSON body', 400, request);
	}

	const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : null;
	const password = typeof body.password === 'string' ? body.password : null;

	if (!email || !password) {
		return err('Email and password are required', 400, request);
	}

	const db = getTursoClient(env);

	// Fetch user — always run password check to avoid timing-based user enumeration
	const { rows } = await db.execute(
		'SELECT id, email, password_hash, role, school_id, district_id, tenant_id, first_name, last_name, is_active FROM users WHERE email = ?',
		[email],
	);

	const user = rows[0];

	// Use a dummy hash so the timing is consistent even when user doesn't exist
	const storedHash = (user?.password_hash as string | null) ?? 'deadbeef:deadbeef';
	const passwordOk = verifyPassword(password, storedHash);

	if (!user || !passwordOk || user.is_active === 0) {
		// Generic message — no user enumeration (SEC-08)
		return err('Invalid email or password. Please try again.', 401, request);
	}

	// Issue access token
	const now = Math.floor(Date.now() / 1000);
	const payload: JwtPayload = {
		sub: user.id as string,
		email: user.email as string,
		role: user.role as string,
		schoolId: user.school_id as string,
		districtId: user.district_id as string,
		tenantId: user.tenant_id as string,
		firstName: user.first_name as string,
		lastName: user.last_name as string,
		iat: now,
		exp: now + ACCESS_TOKEN_TTL,
	};

	const accessToken = await signJwt(payload, env.JWT_SECRET);

	// Issue refresh token — store SHA-256 hash in DB, return plaintext to client
	const refreshToken = generateToken();
	const tokenHash = await hashToken(refreshToken);
	const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000).toISOString();
	const tokenId = crypto.randomUUID();

	await db.execute(
		'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
		[tokenId, user.id as string, tokenHash, expiresAt, new Date().toISOString()],
	);

	// Prune old refresh tokens for this user (keep latest 5)
	await db.execute(
		`DELETE FROM refresh_tokens WHERE user_id = ? AND id NOT IN (
			SELECT id FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
		)`,
		[user.id as string, user.id as string],
	);

	return json(
		{
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
				schoolId: user.school_id,
				districtId: user.district_id,
				tenantId: user.tenant_id,
				firstName: user.first_name,
				lastName: user.last_name,
				isActive: user.is_active === 1,
				createdAt: new Date().toISOString(),
			},
			accessToken,
			refreshToken,
			expiresAt: payload.exp,
		},
		200,
		request,
	);
}
