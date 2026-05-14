/**
 * DEV-ONLY: Injects a fake admin session so you can browse the UI without a live backend.
 * Never imported in production — guarded by __DEV__ at every call site.
 */

import { setSession } from '@/lib/auth/session';

export function injectDevSession(): void {
  setSession({
    user: {
      id: 'dev-admin-001',
      email: 'dev@4e.local',
      role: 'school_admin',
      schoolId: 'school-001',
      districtId: 'district-dev-001',
      tenantId: 'tenant-dev-001',
      firstName: 'Dev',
      lastName: 'Admin',
      createdAt: new Date().toISOString(),
      isActive: true,
    },
    accessToken: 'dev-access-token',
    refreshToken: 'dev-refresh-token',
    expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365,
  });
}
