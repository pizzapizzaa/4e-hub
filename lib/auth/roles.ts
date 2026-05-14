import { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  district_admin: 'District Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  student: 'Student',
  guardian: 'Guardian',
};

export const ROLE_HOME_ROUTES: Record<UserRole, string> = {
  super_admin: '/(admin)',
  district_admin: '/(admin)',
  school_admin: '/(admin)',
  teacher: '/(inaction)',
  student: '/(learn)',
  guardian: '/(learn)',
};

export const ROLE_ICONS: Record<UserRole, string> = {
  super_admin: 'shield.fill',
  district_admin: 'building.2.fill',
  school_admin: 'graduationcap.fill',
  teacher: 'person.2.fill',
  student: 'book.fill',
  guardian: 'heart.fill',
};

export const ADMIN_ROLES: UserRole[] = ['super_admin', 'district_admin', 'school_admin'];
export const TEACHER_ROLES: UserRole[] = ['teacher'];
export const LEARNER_ROLES: UserRole[] = ['student', 'guardian'];

export function canAccess(role: UserRole, section: 'admin' | 'learn' | 'inaction'): boolean {
  if (section === 'admin') return ADMIN_ROLES.includes(role);
  if (section === 'inaction') return TEACHER_ROLES.includes(role);
  if (section === 'learn') return LEARNER_ROLES.includes(role);
  return false;
}

export function getHomeRoute(role: UserRole): string {
  return ROLE_HOME_ROUTES[role] ?? '/(auth)/login';
}
