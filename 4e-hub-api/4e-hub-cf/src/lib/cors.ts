const ALLOWED_ORIGINS = new Set([
	'http://localhost:8081',
	'http://localhost:8787',
	'https://admin-web-gamma-lime.vercel.app',
	'https://4e-hub-cf.4d-admin.workers.dev',
]);

function corsHeaders(origin: string | null): Record<string, string> {
	// Fall back to a null origin (blocked) for unrecognised callers — do NOT
	// reflect an arbitrary origin back, which would open CORS to everyone.
	const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'null';
	return {
		'Access-Control-Allow-Origin': allowed,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '600',
		Vary: 'Origin',
	};
}

export function preflight(request: Request): Response {
	return new Response(null, {
		status: 204,
		headers: corsHeaders(request.headers.get('origin')),
	});
}

export function json(body: unknown, status = 200, request?: Request): Response {
	const origin = request?.headers.get('origin') ?? null;
	return new Response(JSON.stringify(body), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders(origin),
		},
	});
}

export function err(message: string, status: number, request?: Request): Response {
	return json({ error: message }, status, request);
}
