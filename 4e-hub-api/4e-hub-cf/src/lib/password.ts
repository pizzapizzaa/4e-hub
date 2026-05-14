// scrypt password verification using node:crypto (nodejs_compat flag required).
// Stored format: "<hex-salt>:<hex-hash>"

import { scryptSync, timingSafeEqual } from 'node:crypto';

export function verifyPassword(plaintext: string, stored: string): boolean {
	const colonIdx = stored.indexOf(':');
	if (colonIdx === -1) return false;

	const salt = stored.slice(0, colonIdx);
	const expectedHex = stored.slice(colonIdx + 1);

	try {
		const actualHex = scryptSync(plaintext, salt, 64).toString('hex');

		// Constant-time comparison — prevents timing attacks
		return timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(actualHex, 'hex'));
	} catch {
		return false;
	}
}

export function hashPassword(plaintext: string): string {
	const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	const hash = scryptSync(plaintext, salt, 64).toString('hex');
	return `${salt}:${hash}`;
}
