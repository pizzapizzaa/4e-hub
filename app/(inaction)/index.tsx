import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getTeacherClasses } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import type { Class } from '@/types';

export default function InActionDashboard() {
  const router = useRouter();
  const user = getCurrentUser();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getTeacherClasses(user.id).then(setClasses).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#0F2D5A" />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.greeting}>Welcome, {user?.firstName ?? 'Teacher'} 👩‍🏫</Text>
      <Text style={styles.subtitle}>You have {classes.length} active class(es) today.</Text>

      <View style={styles.quickActions}>
        <QuickAction icon="📡" label="Broadcast" onPress={() => router.push('/(inaction)/broadcast' as never)} />
        <QuickAction icon="📋" label="Class List" onPress={() => router.push('/(inaction)/classes' as never)} />
        <QuickAction icon="📓" label="Memoir" onPress={() => router.push('/(inaction)/memoir' as never)} />
        <QuickAction icon="🔧" label="Tools" onPress={() => router.push('/(inaction)/tools' as never)} />
      </View>

      <Text style={styles.sectionHeading}>My Classes</Text>
      {classes.map((cls) => (
        <TouchableOpacity
          key={cls.id}
          style={styles.classCard}
          onPress={() => router.push(`/(inaction)/classes/${cls.id}` as never)}
        >
          <View style={styles.classIcon}>
            <Text style={styles.classIconText}>{cls.subject.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{cls.name}</Text>
            <Text style={styles.classMeta}>{cls.subject} · {cls.studentIds.length} students</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickCard} onPress={onPress}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  loader: { flex: 1, marginTop: 100 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#0F2D5A' },
  subtitle: { fontSize: 15, color: '#666' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '46%', backgroundColor: '#fff', borderRadius: 14, padding: 18, alignItems: 'center', gap: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  quickIcon: { fontSize: 28 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: '#333' },
  sectionHeading: { fontSize: 18, fontWeight: '700', color: '#333' },
  classCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  classIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#0F2D5A', justifyContent: 'center', alignItems: 'center' },
  classIconText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  classInfo: { flex: 1 },
  className: { fontSize: 16, fontWeight: '600', color: '#222' },
  classMeta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  arrow: { fontSize: 22, color: '#AAA' },
});
