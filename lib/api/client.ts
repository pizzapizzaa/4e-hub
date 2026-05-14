// ─── Shared Authenticated HTTP Client ────────────────────────────────────────
// Single source of truth for all authenticated API calls.
// Handles: base URL validation, token expiry check, silent refresh, 401 retry.

import { clearSession, getSession, isSessionExpired, refreshSession } from '@/lib/auth/session';

// ─── Base URL guard (SEC-12) ──────────────────────────────────────────────────

function getBaseUrl(): string {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base) throw new Error('EXPO_PUBLIC_API_URL is not configured');
  return base;
}

// ─── Core fetch wrapper (SEC-05, QA-01) ──────────────────────────────────────

export async function authFetch(path: string, options: RequestInit = {}): Promise<Response> {
  // Check for session existence first — a missing session is not the same as an expired one
  const session = getSession();
  if (!session) throw new Error('Not authenticated. Please log in.');

  // Proactively refresh if the access token is already expired
  if (isSessionExpired()) {
    const refreshed = await refreshSession();
    if (!refreshed) {
      clearSession();
      throw new Error('Session expired. Please log in again.');
    }
  }

  const latestSession = getSession()!;

  const base = getBaseUrl();

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${latestSession.accessToken}`,
      ...options.headers,
    },
  });

  // On 401, attempt a silent refresh and retry exactly once
  if (res.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) {
      const retrySession = getSession()!;
      return fetch(`${base}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${retrySession.accessToken}`,
          ...options.headers,
        },
      });
    }
    clearSession();
    throw new Error('Session expired. Please log in again.');
  }

  return res;
}
