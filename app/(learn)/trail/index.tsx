import { useEffect, useState } from 'react';
import { View, Text, SectionList, StyleSheet, ActivityIndicator } from 'react-native';
import { getLearningTrail, getLearningPath } from '@/lib/api/learn';
import { getCurrentUser } from '@/lib/auth/session';
import { LearningTrailItem } from '@/components/learn/LearningTrail';
import type { LearningTrailEntry, LearningPath } from '@/types';

const SUBJECTS = ['english', 'maths', 'science'] as const;

export default function TrailScreen() {
  const user = getCurrentUser();
  const [trail, setTrail] = useState<LearningTrailEntry[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getLearningTrail(user.id),
      ...SUBJECTS.map((s) => getLearningPath(user.id, s)),
    ])
      .then(([trailEntries, ...learningPaths]) => {
        setTrail(trailEntries as LearningTrailEntry[]);
        setPaths(learningPaths as LearningPath[]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const sections = SUBJECTS.map((subject) => ({
    title: subject.charAt(0).toUpperCase() + subject.slice(1),
    subject,
    data: trail.filter((e) => e.subject === subject),
  })).filter((s) => s.data.length > 0);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#0F2D5A" />;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🗺️ My Learning Trail</Text>
      <Text style={styles.subtitle}>Your history and progress across all subjects.</Text>

      {paths.map((path) => (
        <View key={path.id} style={styles.progressBar}>
          <Text style={styles.progressLabel}>{path.subject} — {path.progressPercent}% complete</Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${path.progressPercent}%` }]} />
          </View>
        </View>
      ))}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => <LearningTrailItem entry={item} />}
        ListEmptyComponent={<Text style={styles.empty}>No lessons completed yet. Start learning!</Text>}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 12 },
  progressBar: { marginHorizontal: 20, marginBottom: 10 },
  progressLabel: { fontSize: 13, color: '#555', marginBottom: 4, textTransform: 'capitalize' },
  barTrack: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4 },
  barFill: { height: 8, backgroundColor: '#0F2D5A', borderRadius: 4 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionHeader: { fontSize: 15, fontWeight: '700', color: '#0F2D5A', marginTop: 16, marginBottom: 8 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
