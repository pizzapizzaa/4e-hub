import { View, Text, StyleSheet } from 'react-native';
import type { LearningTrailEntry } from '@/types';

interface Props {
  entry: LearningTrailEntry;
}

export function LearningTrailItem({ entry }: Props) {
  const date = new Date(entry.completedAt).toLocaleDateString();
  const score = entry.quizScore != null ? `${entry.quizScore}%` : null;

  return (
    <View style={styles.row}>
      <View style={styles.dot} />
      <View style={styles.content}>
        <Text style={styles.lessonId}>Lesson · {entry.lessonId}</Text>
        <View style={styles.meta}>
          <Text style={styles.date}>{date}</Text>
          {score && <Text style={styles.score}>🏆 {score}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0F2D5A', marginTop: 5 },
  content: { flex: 1, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  lessonId: { fontSize: 14, fontWeight: '600', color: '#222' },
  meta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  date: { fontSize: 12, color: '#888' },
  score: { fontSize: 12, color: '#059669', fontWeight: '700' },
});
