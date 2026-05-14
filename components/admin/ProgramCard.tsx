import type { LearningProgram } from '@/types';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  program: LearningProgram;
  onPress: () => void;
}

export function ProgramCard({ program, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>{program.name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{program.name}</Text>
          <Text style={styles.meta}>{program.subjects.join(', ')} · {program.teachingMethod}</Text>
        </View>
      </View>
      {program.description ? <Text style={styles.desc} numberOfLines={2}>{program.description}</Text> : null}
      <Text style={styles.arrow}>View details ›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#FFEDD5', justifyContent: 'center', alignItems: 'center' },
  iconText: { color: '#F97316', fontWeight: '800', fontSize: 13 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#222' },
  meta: { fontSize: 12, color: '#888', marginTop: 2, textTransform: 'capitalize' },
  desc: { fontSize: 13, color: '#666' },
  arrow: { fontSize: 13, color: '#F97316', fontWeight: '600' },
});
