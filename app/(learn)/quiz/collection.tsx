import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getQuizCollection } from '@/lib/api/learn';
import { getCurrentUser } from '@/lib/auth/session';
import type { QuizSession } from '@/types';

const SUBJECT_COLORS: Record<string, string> = {
  english: '#2563EB',
  maths: '#7C3AED',
  science: '#059669',
};

export default function QuizCollectionScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getQuizCollection(user.id).then(setSessions).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#0F2D5A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📚 Quiz Collection</Text>
      <Text style={styles.subtitle}>Practice quizzes from your completed lessons.</Text>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const color = SUBJECT_COLORS[item.subject] ?? '#0F2D5A';
          const scoreText = item.correctAnswers != null
            ? `${item.correctAnswers}/${item.totalQuestions}`
            : item.completedAt ? 'Completed' : 'Not attempted';

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(learn)/quiz/${item.id}` as never)}
            >
              <View style={[styles.badge, { backgroundColor: color + '22' }]}>
                <Text style={[styles.badgeText, { color }]}>{item.subject}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.date}>{new Date(item.generatedAt).toLocaleDateString()}</Text>
                <Text style={styles.score}>{scoreText}</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No quizzes yet. Complete a lesson to generate one.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, gap: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { fontWeight: '700', textTransform: 'capitalize', fontSize: 13 },
  info: { flex: 1 },
  date: { fontSize: 13, color: '#666' },
  score: { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 2 },
  arrow: { fontSize: 22, color: '#AAA' },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15, paddingHorizontal: 20 },
});
