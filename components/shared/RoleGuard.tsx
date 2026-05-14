import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { getCurrentRole } from '@/lib/auth/session';
import { ROLE_HOME_ROUTES } from '@/lib/auth/roles';

type Section = 'admin' | 'learn' | 'inaction';

const SECTION_ROLES: Record<Section, string[]> = {
  admin: ['super_admin', 'district_admin', 'school_admin'],
  learn: ['student', 'guardian'],
  inaction: ['teacher'],
};

interface Props extends PropsWithChildren {
  section: Section;
}

export function RoleGuard({ section, children }: Props) {
  const router = useRouter();
  const role = getCurrentRole();

  useEffect(() => {
    if (!role) {
      router.replace('/(auth)/login' as never);
      return;
    }
    if (!SECTION_ROLES[section].includes(role)) {
      const homeRoute = ROLE_HOME_ROUTES[role];
      router.replace(homeRoute as never);
    }
  }, [role, section]);

  if (!role || !SECTION_ROLES[section].includes(role)) return null;

  return <>{children}</>;
}
