import { IconSymbol } from '@/components/ui/icon-symbol';
import { ROLE_ICONS, ROLE_LABELS, getHomeRoute } from '@/lib/auth/roles';
import { getCurrentUser } from '@/lib/auth/session';
import type { UserRole } from '@/types';
import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Role selection is shown for accounts that can operate in multiple roles
// (e.g. a teacher who is also a school admin). Only roles the user actually
// holds are displayed — arbitrary role escalation is prevented (SEC-03).

const SELECTABLE_ROLES: UserRole[] = [
  'super_admin',
  'district_admin',
  'school_admin',
  'teacher',
  'student',
  'guardian',
];

export default function RoleSelectScreen() {
  const router = useRouter();
  const user = getCurrentUser();

  if (!user) {
    router.replace('/(auth)/login');
    return null;
  }

  // Only show roles the user actually holds — prevents privilege escalation (SEC-03)
  const allowedRoles = SELECTABLE_ROLES.filter(
    (r) => r === user.role || (user.additionalRoles ?? []).includes(r),
  );

  function handleSelect(role: UserRole) {
    // Double-check the user is actually allowed to enter this role
    if (role !== user!.role && !(user!.additionalRoles ?? []).includes(role)) return;
    router.replace(getHomeRoute(role) as never);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select your role</Text>
      <Text style={styles.subtitle}>
        Logged in as {user.firstName} {user.lastName}
      </Text>

      <FlatList
        data={allowedRoles}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => handleSelect(item)}
            accessibilityLabel={ROLE_LABELS[item]}
          >
            <IconSymbol name={ROLE_ICONS[item] as never} size={28} color="#0F2D5A" />
            <Text style={styles.label}>{ROLE_LABELS[item]}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#0F2D5A', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 6, marginBottom: 24 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 18, fontWeight: '600', color: '#222' },
});
