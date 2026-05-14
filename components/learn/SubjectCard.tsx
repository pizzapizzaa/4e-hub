import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';

interface Props {
  label: string;
  subtitle: string;
  icon: string;
  color: string;
  onPress: () => void;
}

export function SubjectCard({ label, subtitle, icon, color, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: color }]} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { fontSize: 30 },
  text: { flex: 1 },
  label: { fontSize: 17, fontWeight: '800', color: '#222' },
  subtitle: { fontSize: 13, color: '#888', marginTop: 2 },
  arrow: { fontSize: 22, color: '#AAA' },
});
