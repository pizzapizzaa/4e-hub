import { SchoolCard } from '@/components/admin/SchoolCard';
import { getSchools } from '@/lib/api/admin';
import type { School } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SchoolsScreen() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSchools().then(setSchools).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={styles.loader} size="large" color="#16A34A" />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Schools</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(admin)/schools/new' as never)}>
          <Text style={styles.addButtonText}>+ Add School</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={schools}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <SchoolCard school={item} onPress={() => router.push(`/(admin)/schools/${item.id}` as never)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No schools registered yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loader: { flex: 1, marginTop: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  heading: { fontSize: 24, fontWeight: '800', color: '#16A34A' },
  addButton: { backgroundColor: '#16A34A', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  addButtonText: { color: '#fff', fontWeight: '700' },
  list: { paddingHorizontal: 20, gap: 12 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60, fontSize: 15 },
});
