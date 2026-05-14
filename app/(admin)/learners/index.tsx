import { getLearners } from '@/lib/api/admin';
import type { Student } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LearnersScreen() {
  const router = useRouter();
  const [learners, setLearners] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLearners().then(setLearners).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#F97316" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Learners</Text>
      <FlatList
        data={learners}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(admin)/learners/${item.id}` as never)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.graduationYear}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>Student {item.id.slice(0, 8)}</Text>
              <Text style={styles.meta}>Class(es): {item.classIds.length} · Grad: {item.graduationYear}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No learners found.</Text>}
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
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#222' },
  meta: { fontSize: 13, color: '#888', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
