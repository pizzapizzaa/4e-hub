import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getClass, getClassStudents } from '@/lib/api/inaction';
import { ClassRoster } from '@/components/inaction/ClassRoster';
import type { Class, Student } from '@/types';

export default function ClassDetailScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const router = useRouter();
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClass(classId!), getClassStudents(classId!)])
      .then(([c, s]) => { setCls(c); setStudents(s); })
      .finally(() => setLoading(false));
  }, [classId]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0F2D5A" />;
  if (!cls) return <Text style={styles.error}>Class not found.</Text>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>{cls.name}</Text>
        <Text style={styles.meta}>{cls.subject} · {cls.academicYear} · {students.length} students</Text>
      </View>

      <ClassRoster
        students={students}
        onStudentPress={(studentId) => router.push(`/(inaction)/students/${studentId}` as never)}
      />

      <TouchableOpacity
        style={styles.broadcastButton}
        onPress={() => router.push('/(inaction)/broadcast' as never)}
      >
        <Text style={styles.broadcastButtonText}>📡 Broadcast to This Class</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  header: { padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  meta: { fontSize: 14, color: '#888', textTransform: 'capitalize' },
  broadcastButton: { margin: 20, backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  broadcastButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
