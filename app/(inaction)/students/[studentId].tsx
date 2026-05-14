import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getStudent, getMemoirs } from '@/lib/api/inaction';
import { MemoirEntry } from '@/components/inaction/MemoirEntry';
import { getCurrentUser } from '@/lib/auth/session';
import type { Student, TeacherMemoir } from '@/types';

export default function StudentDetailScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>();
  const router = useRouter();
  const user = getCurrentUser();

  const [student, setStudent] = useState<Student | null>(null);
  const [memoirs, setMemoirs] = useState<TeacherMemoir[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getStudent(studentId!), getMemoirs(user.id, studentId!)])
      .then(([s, m]) => { setStudent(s); setMemoirs(m); })
      .finally(() => setLoading(false));
  }, [studentId, user]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0F2D5A" />;
  if (!student) return <Text style={styles.error}>Student not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Student Profile</Text>
      <Text style={styles.id}>ID: {student.id}</Text>
      <Text style={styles.meta}>Grad: {student.graduationYear} · {student.classIds.length} class(es)</Text>

      <View style={styles.memoirHeader}>
        <Text style={styles.sectionTitle}>Teacher's Memoir ({memoirs.length})</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push(`/(inaction)/memoir/${studentId}` as never)}
        >
          <Text style={styles.addButtonText}>+ Add Note</Text>
        </TouchableOpacity>
      </View>

      {memoirs.map((m) => <MemoirEntry key={m.id} memoir={m} />)}
      {memoirs.length === 0 && (
        <Text style={styles.empty}>No memoir entries yet. Add your first note.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  id: { fontSize: 13, color: '#888', fontFamily: 'monospace' },
  meta: { fontSize: 14, color: '#666' },
  memoirHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  addButton: { backgroundColor: '#0F2D5A', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7 },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#999', fontSize: 14 },
});
