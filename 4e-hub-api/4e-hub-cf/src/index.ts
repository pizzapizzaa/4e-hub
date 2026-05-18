import { handleGetLearners } from './admin/learners.ts';
import { handleGetMaterials, handleUpdateMaterials } from './admin/materials.ts';
import { handleCreateProgram, handleGetPrograms } from './admin/programs.ts';
import { handleCreateSchool, handleGetSchool, handleGetSchools, handleUpdateSchool } from './admin/schools.ts';
import { handleGetSyncStatus, handleTriggerSync } from './admin/sync.ts';
import { handleCreateTeacher, handleGetTeachers } from './admin/teachers.ts';
import { handleLogin } from './auth/login.ts';
import { handleLogout } from './auth/logout.ts';
import { handleGenerateOnboarding, handleSetOnboardPassword } from './auth/onboard.ts';
import { handleRefresh } from './auth/refresh.ts';
import { handleEndBroadcast, handleGetBroadcasts, handleStartBroadcast } from './inaction/broadcasts.ts';
import { handleGetClass, handleGetClassStudents, handleGetTeacherClasses } from './inaction/classes.ts';
import { handleCreateMemoir, handleGetMemoirs, handleUpdateMemoir } from './inaction/memoir.ts';
import { handleGetStudent } from './inaction/students.ts';
import { err, preflight } from './lib/cors.ts';
import { handleAddTeacherMaterial, handleGetTeacherMaterials } from './teacher/materials.ts';

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
		let { pathname } = new URL(url);

		// Normalize pathname by removing a single trailing slash (except for root)
		// This avoids accidental 404s when clients include trailing slashes.
		if (pathname.length > 1 && pathname.endsWith('/')) {
			pathname = pathname.slice(0, -1);
		}

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
		if (method === 'POST' && pathname === '/api/auth/onboard-set-password') return handleSetOnboardPassword(request, env);

		// Admin routes
		if (method === 'GET'  && pathname === '/api/admin/schools')           return handleGetSchools(request, env);
		if (method === 'POST' && pathname === '/api/admin/schools')           return handleCreateSchool(request, env);
				if (pathname.startsWith('/api/admin/schools/')) {
					const id = pathname.slice('/api/admin/schools/'.length);
					if (method === 'GET') return handleGetSchool(request, env, id);
					if (method === 'PUT') return handleUpdateSchool(request, env, id);
				}
		if (method === 'GET'  && pathname === '/api/admin/programs')          return handleGetPrograms(request, env);
		if (method === 'POST' && pathname === '/api/admin/programs')          return handleCreateProgram(request, env);
		if (method === 'GET'  && pathname === '/api/admin/teachers')          return handleGetTeachers(request, env);
		if (method === 'POST' && pathname === '/api/admin/teachers')          return handleCreateTeacher(request, env);
		if (method === 'GET'  && pathname === '/api/admin/learners')          return handleGetLearners(request, env);
		if (method === 'GET'  && pathname === '/api/admin/sync/status')       return handleGetSyncStatus(request, env);
		if (method === 'POST' && pathname === '/api/admin/sync/trigger')      return handleTriggerSync(request, env);
		const materialsMatch = pathname.match(/^\/api\/admin\/materials\/([^/]+)$/);
		if (materialsMatch) {
			const schoolId = materialsMatch[1];
			if (method === 'GET') return handleGetMaterials(request, env, schoolId);
			if (method === 'PUT') return handleUpdateMaterials(request, env, schoolId);
		}

		if (pathname === '/api/teacher/materials') {
			if (method === 'GET') return handleGetTeacherMaterials(request, env);
			if (method === 'POST') return handleAddTeacherMaterial(request, env);
		}

		// In-action (teacher) routes
		if (method === 'GET' && pathname === '/api/inaction/classes') return handleGetTeacherClasses(request, env);
		const classMatch = pathname.match(/^\/api\/inaction\/classes\/([^/]+)(?:\/students)?$/);
		if (classMatch) {
			const id = classMatch[1];
			if (pathname.endsWith('/students') && method === 'GET') return handleGetClassStudents(request, env, id);
			if (method === 'GET') return handleGetClass(request, env, id);
		}

		const studentMatch = pathname.match(/^\/api\/inaction\/students\/([^/]+)$/);
		if (studentMatch && method === 'GET') return handleGetStudent(request, env, studentMatch[1]);

		if (method === 'GET' && pathname === '/api/inaction/memoir') return handleGetMemoirs(request, env);
		if (method === 'POST' && pathname === '/api/inaction/memoir') return handleCreateMemoir(request, env);
		const memoirMatch = pathname.match(/^\/api\/inaction\/memoir\/([^/]+)$/);
		if (memoirMatch && method === 'PUT') return handleUpdateMemoir(request, env, memoirMatch[1]);

		if (method === 'GET' && pathname === '/api/inaction/broadcasts') return handleGetBroadcasts(request, env);
		if (method === 'POST' && pathname === '/api/inaction/broadcasts') return handleStartBroadcast(request, env);
		const broadcastEndMatch = pathname.match(/^\/api\/inaction\/broadcasts\/([^/]+)\/end$/);
		if (broadcastEndMatch && method === 'POST') return handleEndBroadcast(request, env, broadcastEndMatch[1]);

		// Admin onboarding token generation
		if (method === 'POST' && pathname === '/api/admin/teachers/onboard') return handleGenerateOnboarding(request, env);

		return err('Not found', 404, request);
}
