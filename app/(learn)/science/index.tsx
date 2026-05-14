import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getLessons } from '@/lib/api/learn';
import type { Lesson } from '@/types';

const PROGRAM_ID = process.env.EXPO_PUBLIC_SCIENCE_PROGRAM_ID ?? 'science-pilot';

export default function ScienceHomeScreen() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessons(PROGRAM_ID, 'science').then(setLessons).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#059669" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔬 Science</Text>
      <Text style={styles.subtitle}>Explore the Natural World via video lessons</Text>

      <FlatList
        data={lessons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(learn)/science/${item.id}` as never)}
          >
            <View style={styles.lessonNumber}>
              <Text style={styles.lessonNumberText}>{item.order}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.duration}>{item.durationMinutes} min</Text>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No lessons available yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 26, fontWeight: '800', color: '#059669', padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  lessonNumber: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center' },
  lessonNumberText: { fontWeight: '700', color: '#059669', fontSize: 14 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#222' },
  duration: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#AAA' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
