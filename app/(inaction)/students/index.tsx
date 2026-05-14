import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getTeacherClasses, getClassStudents } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import type { Student } from '@/types';

export default function StudentsScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const classes = await getTeacherClasses(user!.id);
      const allStudents = await Promise.all(classes.map((c) => getClassStudents(c.id)));
      // Deduplicate by student ID
      const map = new Map<string, Student>();
      allStudents.flat().forEach((s) => map.set(s.id, s));
      setStudents(Array.from(map.values()));
    }
    load().finally(() => setLoading(false));
  }, [user]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#0F2D5A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Students</Text>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(inaction)/students/${item.id}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.graduationYear.toString().slice(-2)}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Student {item.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>Grad: {item.graduationYear} · {item.classIds.length} class(es)</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No students found.</Text>}
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0F2D5A', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#222' },
  meta: { fontSize: 13, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#AAA' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
