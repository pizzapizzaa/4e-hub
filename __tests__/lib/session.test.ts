// ─── Auth layer unit tests ─────────────────────────────────────────────────────

import type { Session } from '@/lib/auth/session';
import {
    clearSession,
    getCurrentRole,
    getCurrentUser,
    getSession,
    isSessionExpired,
    parseJwtPayload,
    setSession,
} from '@/lib/auth/session';
import { mockUser } from '../helpers/fixtures';

// Mock SecureStore so tests don't touch the OS keychain
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    user: mockUser,
    accessToken: 'access.token.here',
    refreshToken: 'refresh.token.here',
    expiresAt: Math.floor(Date.now() / 1000) + 3600, // valid for 1 hour
    ...overrides,
  };
}

describe('session', () => {
  beforeEach(() => clearSession());

  describe('setSession / getSession', () => {
    it('stores and retrieves a session', () => {
      const s = makeSession();
      setSession(s);
      expect(getSession()).toEqual(s);
    });

    it('returns null before any session is set', () => {
      expect(getSession()).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('removes the stored session', () => {
      setSession(makeSession());
      clearSession();
      expect(getSession()).toBeNull();
    });
  });

  describe('getCurrentUser / getCurrentRole', () => {
    it('returns user and role from active session', () => {
      setSession(makeSession());
      expect(getCurrentUser()).toEqual(mockUser);
      expect(getCurrentRole()).toBe('school_admin');
    });

    it('returns null when no session exists', () => {
      expect(getCurrentUser()).toBeNull();
      expect(getCurrentRole()).toBeNull();
    });
  });

  describe('isSessionExpired', () => {
    it('returns false for a future expiresAt', () => {
      setSession(makeSession({ expiresAt: Math.floor(Date.now() / 1000) + 3600 }));
      expect(isSessionExpired()).toBe(false);
    });

    it('returns true for a past expiresAt', () => {
      setSession(makeSession({ expiresAt: Math.floor(Date.now() / 1000) - 1 }));
      expect(isSessionExpired()).toBe(true);
    });

    it('returns true when no session exists', () => {
      expect(isSessionExpired()).toBe(true);
    });
  });

  describe('parseJwtPayload', () => {
    it('decodes a well-formed JWT payload', () => {
      // Header.Payload.Signature — payload is base64url-encoded JSON
      const payload = { sub: 'user-001', role: 'school_admin' };
      const encoded = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const token = `header.${encoded}.sig`;

      expect(parseJwtPayload(token)).toEqual(payload);
    });

    it('returns null for a malformed token', () => {
      expect(parseJwtPayload('not-a-jwt')).toBeNull();
      expect(parseJwtPayload('')).toBeNull();
    });
  });
});
