import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getPrograms, updateProgram } from '@/lib/api/admin';
import type { LearningProgram } from '@/types';

export default function ProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [program, setProgram] = useState<LearningProgram | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms()
      .then((list) => setProgram(list.find((p) => p.id === id) ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  async function toggleActive() {
    if (!program) return;
    try {
      const updated = await updateProgram(program.id, { isActive: !program.isActive });
      setProgram(updated);
    } catch {
      Alert.alert('Error', 'Could not update program status.');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0F2D5A" />;
  if (!program) return <Text style={styles.error}>Program not found.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{program.name}</Text>
      <Text style={styles.meta}>{program.subject.toUpperCase()} · Level {program.level}</Text>
      <Text style={styles.description}>{program.description}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teaching Method</Text>
        <Text style={styles.value}>{program.teachingMethod.replace('_', ' ')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Material Sources</Text>
        {program.materialSources.map((s) => (
          <Text key={s} style={styles.chip}>{s.replace('_', ' ')}</Text>
        ))}
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.sectionTitle}>Active</Text>
        <Switch value={program.isActive} onValueChange={toggleActive} trackColor={{ true: '#0F2D5A' }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assigned to {program.schoolIds.length} school(s)</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60 },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  meta: { fontSize: 13, color: '#888', marginBottom: 12 },
  description: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#222', textTransform: 'capitalize' },
  chip: { fontSize: 14, color: '#0F2D5A', backgroundColor: '#E8EFFE', alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  toggleRow: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
