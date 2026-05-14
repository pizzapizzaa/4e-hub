import { ProgramCard } from '@/components/admin/ProgramCard';
import { getPrograms } from '@/lib/api/admin';
import type { LearningProgram } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProgramsScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<LearningProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPrograms().then(setPrograms).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#F97316" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Learning Programs</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(admin)/programs/new' as never)}
        >
          <Text style={styles.addButtonText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ProgramCard
            program={item}
            onPress={() => router.push(`/(admin)/programs/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No programs yet. Add one to get started.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: '#16A34A' },
  addButton: { backgroundColor: '#F97316', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
