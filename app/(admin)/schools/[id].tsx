import { getLearners, getSchool, getTeachers } from '@/lib/api/admin';
import type { School, Student, Teacher } from '@/types';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [learners, setLearners] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSchool(id!), getTeachers(id!), getLearners(id!)])
      .then(([s, t, l]) => { setSchool(s); setTeachers(t); setLearners(l); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#16A34A" />;
  if (!school) return <Text style={styles.error}>School not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{school.name}</Text>
      <Text style={styles.meta}>{school.address}</Text>

      <View style={styles.row}>
        <InfoBox label="Teachers" value={teachers.length} />
        <InfoBox label="Learners" value={learners.length} />
        <InfoBox label="Status" value={school.isActive ? 'Active' : 'Inactive'} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>District ID</Text>
        <Text style={styles.value}>{school.districtId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Administrators</Text>
        {school.adminIds.map((adminId) => (
          <Text key={adminId} style={styles.idChip}>{adminId}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoValue}>{value}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60 },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  heading: { fontSize: 26, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  meta: { fontSize: 14, color: '#888', marginBottom: 20 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  infoBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  infoValue: { fontSize: 22, fontWeight: '800', color: '#16A34A' },
  infoLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  value: { fontSize: 15, color: '#222' },
  idChip: { fontSize: 12, color: '#666', fontFamily: 'monospace' },
});
