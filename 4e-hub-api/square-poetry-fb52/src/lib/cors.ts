// Allowed origins — tighten this once you have a production domain
const ALLOWED_ORIGINS = new Set([
	'http://localhost:8081',
	'http://localhost:8787',
	'https://4e-hub.workers.dev',
]);

function corsHeaders(origin: string | null): Record<string, string> {
	const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'http://localhost:8081';
	return {
		'Access-Control-Allow-Origin': allowed,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
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
