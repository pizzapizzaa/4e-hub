import { handleLogin } from './auth/login.ts';
import { handleLogout } from './auth/logout.ts';
import { handleRefresh } from './auth/refresh.ts';
import { err, preflight } from './lib/cors.ts';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		try {
		return await handleRequest(request, env);
		} catch (e) {
			// Always return CORS headers even on unhandled errors
			return err(`Internal server error: ${e instanceof Error ? e.message : String(e)}`, 500, request);
		}
	},
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env): Promise<Response> {
		const { method, url } = request;
		const { pathname } = new URL(url);

		// CORS preflight
		if (method === 'OPTIONS') return preflight(request);

		// Health check
		if (method === 'GET' && pathname === '/health') {
			return new Response(JSON.stringify({ ok: true }), {
				headers: { 'Content-Type': 'application/json' },
			});
		}

		// Auth routes
		if (method === 'POST' && pathname === '/api/auth/login')   return handleLogin(request, env);
		if (method === 'POST' && pathname === '/api/auth/refresh') return handleRefresh(request, env);
		if (method === 'POST' && pathname === '/api/auth/logout')  return handleLogout(request, env);

		return err('Not found', 404, request);
}
