import { err } from './cors.ts';
import { type JwtPayload, verifyJwt } from './jwt.ts';

/**
 * Extracts and verifies the JWT from the Authorization header.
 *
 * Returns the verified payload on success, or a 401 Response on failure.
 * Usage in a route handler:
 *
 *   const result = await requireAuth(request, env);
 *   if (result instanceof Response) return result;
 *   // result is JwtPayload — access result.sub, result.role, etc.
 */
export async function requireAuth(
	request: Request,
	env: Env,
): Promise<JwtPayload | Response> {
	const authHeader = request.headers.get('Authorization');
	const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
	if (!token) return err('Authorization header required', 401, request);

	const payload = await verifyJwt(token, env.JWT_SECRET);
	if (!payload) return err('Invalid or expired access token', 401, request);

	return payload;
}
