import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getTeacherClasses } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import type { Class } from '@/types';

const SUBJECT_COLORS: Record<string, string> = {
  english: '#2563EB',
  maths: '#7C3AED',
  science: '#059669',
};

export default function ClassesScreen() {
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
    <View style={styles.container}>
      <Text style={styles.heading}>My Classes</Text>

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const color = SUBJECT_COLORS[item.subject] ?? '#0F2D5A';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(inaction)/classes/${item.id}` as never)}
            >
              <View style={[styles.badge, { backgroundColor: color }]}>
                <Text style={styles.badgeText}>{item.subject.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.subject} · {item.studentIds.length} students · {item.academicYear}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No classes assigned yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', padding: 20, paddingTop: 60 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  badge: { width: 44, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#222' },
  meta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  arrow: { fontSize: 22, color: '#AAA' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
