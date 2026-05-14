import { getTeachers } from '@/lib/api/admin';
import type { Teacher } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function TeachersScreen() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTeachers().then(setTeachers).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#16A34A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Teachers</Text>

      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(admin)/teachers/${item.id}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.id.slice(0, 2).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Teacher {item.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>{item.subjectAreas.join(', ')} · {item.classIds.length} class(es)</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No teachers found.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 24, fontWeight: '800', color: '#16A34A', padding: 20, paddingTop: 60 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FACC15', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#1F2937', fontWeight: '700', fontSize: 14 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#222' },
  meta: { fontSize: 13, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
