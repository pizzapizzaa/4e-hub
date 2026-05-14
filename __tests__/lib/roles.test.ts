// ─── canAccess / role guard unit tests ────────────────────────────────────────

import { ADMIN_ROLES, canAccess, getHomeRoute } from '@/lib/auth/roles';
import type { UserRole } from '@/types';

describe('canAccess', () => {
  const adminRoles: UserRole[] = ['super_admin', 'district_admin', 'school_admin'];
  const teacherRoles: UserRole[] = ['teacher'];
  const learnerRoles: UserRole[] = ['student', 'guardian'];

  it.each(adminRoles)('%s can access admin', (role) => {
    expect(canAccess(role, 'admin')).toBe(true);
  });

  it.each([...teacherRoles, ...learnerRoles])('%s cannot access admin', (role) => {
    expect(canAccess(role, 'admin')).toBe(false);
  });

  it.each(teacherRoles)('%s can access inaction', (role) => {
    expect(canAccess(role, 'inaction')).toBe(true);
  });

  it.each([...adminRoles, ...learnerRoles])('%s cannot access inaction', (role) => {
    expect(canAccess(role, 'inaction')).toBe(false);
  });

  it.each(learnerRoles)('%s can access learn', (role) => {
    expect(canAccess(role, 'learn')).toBe(true);
  });

  it.each([...adminRoles, ...teacherRoles])('%s cannot access learn', (role) => {
    expect(canAccess(role, 'learn')).toBe(false);
  });
});

describe('getHomeRoute', () => {
  it('sends admins to /(admin)', () => {
    expect(getHomeRoute('super_admin')).toBe('/(admin)');
    expect(getHomeRoute('district_admin')).toBe('/(admin)');
    expect(getHomeRoute('school_admin')).toBe('/(admin)');
  });

  it('sends teacher to /(inaction)', () => {
    expect(getHomeRoute('teacher')).toBe('/(inaction)');
  });

  it('sends student/guardian to /(learn)', () => {
    expect(getHomeRoute('student')).toBe('/(learn)');
    expect(getHomeRoute('guardian')).toBe('/(learn)');
  });
});

describe('ADMIN_ROLES constant', () => {
  it('contains exactly the three admin roles', () => {
    expect(ADMIN_ROLES).toEqual(
      expect.arrayContaining(['super_admin', 'district_admin', 'school_admin']),
    );
    expect(ADMIN_ROLES).toHaveLength(3);
  });
});
