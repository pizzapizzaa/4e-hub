import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getMemoirs } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import { MemoirEntry } from '@/components/inaction/MemoirEntry';
import type { TeacherMemoir } from '@/types';

export default function MemoirIndexScreen() {
  const router = useRouter();
  const user = getCurrentUser();
  const [memoirs, setMemoirs] = useState<TeacherMemoir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMemoirs(user.id).then(setMemoirs).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#0F2D5A" />;

  // Group by student
  const grouped = memoirs.reduce<Record<string, TeacherMemoir[]>>((acc, m) => {
    if (!acc[m.studentId]) acc[m.studentId] = [];
    acc[m.studentId].push(m);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📓 Teacher's Memoir</Text>
      <Text style={styles.subtitle}>Your private notes, linked to each student's profile.</Text>

      <FlatList
        data={Object.entries(grouped)}
        keyExtractor={([studentId]) => studentId}
        contentContainerStyle={styles.list}
        renderItem={({ item: [studentId, entries] }) => (
          <TouchableOpacity
            style={styles.studentBlock}
            onPress={() => router.push(`/(inaction)/memoir/${studentId}` as never)}
          >
            <Text style={styles.studentId}>Student: {studentId.slice(0, 12)}...</Text>
            <Text style={styles.count}>{entries.length} note(s)</Text>
            <Text style={styles.latest}>{entries[0].note.slice(0, 60)}...</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No memoir entries yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', padding: 20, paddingTop: 60, paddingBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingHorizontal: 20, gap: 12 },
  studentBlock: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  studentId: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  count: { fontSize: 14, fontWeight: '700', color: '#0F2D5A' },
  latest: { fontSize: 13, color: '#555', marginTop: 2 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
