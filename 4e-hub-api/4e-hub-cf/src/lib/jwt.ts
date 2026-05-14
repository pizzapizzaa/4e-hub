// HS256 JWT using the Web Crypto API — no external dependencies.

const ALG = { name: 'HMAC', hash: 'SHA-256' } as const;

function b64url(input: string): string {
	return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlBytes(bytes: ArrayBuffer): string {
	return btoa(String.fromCharCode(...new Uint8Array(bytes)))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

function b64urlDecode(input: string): string {
	return atob(input.replace(/-/g, '+').replace(/_/g, '/'));
}

export interface JwtPayload {
	sub: string;       // user id
	email: string;
	role: string;
	schoolId: string;
	districtId: string;
	tenantId: string;
	firstName: string;
	lastName: string;
	iat: number;       // issued at (seconds)
	exp: number;       // expires at (seconds)
}

const HEADER = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
	const body = b64url(JSON.stringify(payload));
	const data = `${HEADER}.${body}`;

	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), ALG, false, ['sign']);
	const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));

	return `${data}.${b64urlBytes(sig)}`;
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
	const parts = token.split('.');
	if (parts.length !== 3) return null;

	try {
		const data = `${parts[0]}.${parts[1]}`;
		const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), ALG, false, ['verify']);
		const sigBytes = Uint8Array.from(b64urlDecode(parts[2]), (c) => c.charCodeAt(0));

		const valid = await crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(data));
		if (!valid) return null;

		const payload = JSON.parse(b64urlDecode(parts[1])) as JwtPayload;
		if (payload.exp < Math.floor(Date.now() / 1000)) return null;

		return payload;
	} catch {
		return null;
	}
}

/** Hash a random refresh token for safe DB storage (SHA-256 hex). */
export async function hashToken(token: string): Promise<string> {
	const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/** Generate a cryptographically random opaque token (64 hex chars). */
export function generateToken(): string {
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
