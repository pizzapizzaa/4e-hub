import { handleGetLearners } from './admin/learners.ts';
import { handleGetMaterials, handleUpdateMaterials } from './admin/materials.ts';
import { handleGetPrograms } from './admin/programs.ts';
import { handleGetSchool, handleGetSchools } from './admin/schools.ts';
import { handleGetSyncStatus, handleTriggerSync } from './admin/sync.ts';
import { handleGetTeachers } from './admin/teachers.ts';
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

		// Admin routes
		if (method === 'GET'  && pathname === '/api/admin/schools')           return handleGetSchools(request, env);
		if (method === 'GET'  && pathname.startsWith('/api/admin/schools/'))  return handleGetSchool(request, env, pathname.slice('/api/admin/schools/'.length));
		if (method === 'GET'  && pathname === '/api/admin/programs')          return handleGetPrograms(request, env);
		if (method === 'GET'  && pathname === '/api/admin/teachers')          return handleGetTeachers(request, env);
		if (method === 'GET'  && pathname === '/api/admin/learners')          return handleGetLearners(request, env);
		if (method === 'GET'  && pathname === '/api/admin/sync/status')       return handleGetSyncStatus(request, env);
		if (method === 'POST' && pathname === '/api/admin/sync/trigger')      return handleTriggerSync(request, env);
		const materialsMatch = pathname.match(/^\/api\/admin\/materials\/([^/]+)$/);
		if (materialsMatch) {
			const schoolId = materialsMatch[1];
			if (method === 'GET') return handleGetMaterials(request, env, schoolId);
			if (method === 'PUT') return handleUpdateMaterials(request, env, schoolId);
		}

		return err('Not found', 404, request);
}
