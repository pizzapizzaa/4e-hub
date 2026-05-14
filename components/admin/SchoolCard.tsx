import type { School } from '@/types';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  school: School;
  onPress: () => void;
}

export function SchoolCard({ school, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.left}>
        <View style={styles.iconBadge}>
          <Text style={styles.iconText}>🏫</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{school.name}</Text>
          <Text style={styles.meta} numberOfLines={1}>{school.address}</Text>
        </View>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBadge: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#DCFCE7', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 22 },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#222' },
  meta: { fontSize: 12, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#AAA' },
});
