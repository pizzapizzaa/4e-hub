import { err, json } from '../lib/cors.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

// Default config returned when no override is stored
const DEFAULT_CONFIG = {
	khanAcademy: { enabled: false, courseIds: [] },
	openEdx:     { enabled: false, courseIds: [] },
	youtube:     { enabled: false, playlistIds: [] },
};

export async function handleGetMaterials(request: Request, env: Env, schoolId: string): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);
	if (auth.role === 'school_admin' && auth.schoolId !== schoolId) return err('Forbidden', 403, request);

	// Materials config is not yet persisted — return defaults
	return json(DEFAULT_CONFIG, 200, request);
}

export async function handleUpdateMaterials(request: Request, env: Env, schoolId: string): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);
	if (auth.role === 'school_admin' && auth.schoolId !== schoolId) return err('Forbidden', 403, request);

	// Materials config persistence not yet implemented — acknowledge
	return json({ ok: true }, 200, request);
}
