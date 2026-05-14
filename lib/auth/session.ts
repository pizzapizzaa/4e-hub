import { User, UserRole } from '@/types';
import * as SecureStore from 'expo-secure-store';

// ─── Session Store ────────────────────────────────────────────────────────────
// Tokens are persisted in the OS keychain via expo-secure-store (SEC-04).
// The synchronous in-memory cache is hydrated once at app start via hydrateSession().
// Never put tokens in AsyncStorage or global state without encryption.

const SESSION_KEY = 'e4hub_session_v1';

let _session: Session | null = null;

export interface Session {
  user: User;
  accessToken: string;   // short-lived JWT
  refreshToken: string;  // persisted in OS keychain, never in plaintext storage
  expiresAt: number;     // Unix timestamp (seconds)
}

/** Call once in the root layout on app start to restore a persisted session. */
export async function hydrateSession(): Promise<void> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY);
    if (raw) _session = JSON.parse(raw) as Session;
  } catch {
    _session = null;
  }
}

export function setSession(session: Session): void {
  _session = session;
  // Persist asynchronously to OS keychain — fire-and-forget, synchronous callers unaffected
  SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)).catch(() => {});
}

export function getSession(): Session | null {
  return _session;
}

export function clearSession(): void {
  _session = null;
  SecureStore.deleteItemAsync(SESSION_KEY).catch(() => {});
}

export function getCurrentUser(): User | null {
  return _session?.user ?? null;
}

export function getCurrentRole(): UserRole | null {
  return _session?.user?.role ?? null;
}

export function getTenantId(): string | null {
  return _session?.user?.tenantId ?? null;
}

export function getSchoolId(): string | null {
  return _session?.user?.schoolId ?? null;
}

export function isSessionExpired(): boolean {
  if (!_session) return true;
  return Date.now() >= _session.expiresAt * 1000;
}

// ─── Silent Token Refresh (SEC-09) ────────────────────────────────────────────

/** Attempts to refresh the access token using the stored refresh token.
 *  Returns true on success, false if the refresh token is invalid or expired.
 */
export async function refreshSession(): Promise<boolean> {
  if (!_session?.refreshToken) return false;
  try {
    const base = process.env.EXPO_PUBLIC_API_URL;
    if (!base) return false;
    const res = await fetch(`${base}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: _session.refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { accessToken: string; refreshToken: string; expiresAt: number };
    setSession({ ..._session, accessToken: data.accessToken, refreshToken: data.refreshToken, expiresAt: data.expiresAt });
    return true;
  } catch {
    return false;
  }
}

// ─── JWT Payload Decoder ──────────────────────────────────────────────────────
// FOR DISPLAY PURPOSES ONLY — signature is NOT verified client-side.
// NEVER use decoded claims for access-control decisions (SEC-11).

export function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}
