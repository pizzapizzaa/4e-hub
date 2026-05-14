import { FlatList, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Student } from '@/types';

interface Props {
  students: Student[];
  onStudentPress: (studentId: string) => void;
}

export function ClassRoster({ students, onStudentPress }: Props) {
  return (
    <FlatList
      data={students}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => (
        <TouchableOpacity style={styles.row} onPress={() => onStudentPress(item.id)}>
          <View style={styles.number}>
            <Text style={styles.numberText}>{index + 1}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.studentId}>Student {item.id.slice(0, 10)}…</Text>
            <Text style={styles.meta}>Grad: {item.graduationYear}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      )}
      ListEmptyComponent={<Text style={styles.empty}>No students in this class.</Text>}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 8 },
  row: { backgroundColor: '#fff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  number: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  numberText: { fontSize: 13, fontWeight: '700', color: '#555' },
  info: { flex: 1 },
  studentId: { fontSize: 14, fontWeight: '600', color: '#222' },
  meta: { fontSize: 12, color: '#888', marginTop: 1 },
  arrow: { fontSize: 20, color: '#CCC' },
  empty: { textAlign: 'center', color: '#999', fontSize: 14, marginTop: 40 },
});
