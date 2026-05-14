import { err, json } from '../lib/cors.ts';
import { getTursoClient } from '../lib/db.ts';
import { requireAuth } from '../lib/require-auth.ts';

const ADMIN_ROLES = new Set(['super_admin', 'district_admin', 'school_admin']);

export async function handleGetSyncStatus(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	// Return a live status based on DB connectivity
	const db = getTursoClient(env);
	try {
		await db.execute('SELECT 1');
		return json({
			lastSyncedAt:  new Date().toISOString(),
			isPending:     false,
			error:         null,
			pendingChanges: 0,
			connectedApps: ['turso'],
		}, 200, request);
	} catch (e) {
		return json({
			lastSyncedAt:  null,
			isPending:     false,
			error:         e instanceof Error ? e.message : 'DB unreachable',
			pendingChanges: 0,
			connectedApps: [],
		}, 200, request);
	}
}

export async function handleTriggerSync(request: Request, env: Env): Promise<Response> {
	const auth = await requireAuth(request, env);
	if (auth instanceof Response) return auth;
	if (!ADMIN_ROLES.has(auth.role)) return err('Forbidden', 403, request);

	// No background sync job yet — acknowledge the request
	return json({ ok: true, message: 'Sync acknowledged' }, 200, request);
}
