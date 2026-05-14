import type { TeachingMethod } from '@/types';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const TEACHING_METHODS: { value: TeachingMethod; label: string; description: string }[] = [
  { value: 'direct_instruction', label: 'Direct Instruction', description: 'Teacher-led structured lessons.' },
  { value: 'inquiry_based', label: 'Inquiry-Based', description: 'Students explore and discover through questions.' },
  { value: 'flipped_classroom', label: 'Flipped Classroom', description: 'Content at home, practice in class.' },
  { value: 'blended', label: 'Blended Learning', description: 'Mix of online and in-person activities.' },
];

export default function SettingsScreen() {
  const [selectedMethod, setSelectedMethod] = useState<TeachingMethod>('blended');

  function handleSave() {
    // TODO: persist via admin API
    Alert.alert('Saved', `Teaching method set to: ${selectedMethod}`);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Teaching Method Settings</Text>
      <Text style={styles.subtitle}>Set the default teaching approach for this school.</Text>

      {TEACHING_METHODS.map((m) => (
        <TouchableOpacity
          key={m.value}
          style={[styles.card, selectedMethod === m.value && styles.cardSelected]}
          onPress={() => setSelectedMethod(m.value)}
        >
          <View style={styles.radio}>
            {selectedMethod === m.value && <View style={styles.radioDot} />}
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardLabel, selectedMethod === m.value && styles.cardLabelSelected]}>
              {m.label}
            </Text>
            <Text style={styles.cardDesc}>{m.description}</Text>
          </View>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  heading: { fontSize: 24, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardSelected: { borderColor: '#16A34A' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#16A34A', justifyContent: 'center', alignItems: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#16A34A' },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '600', color: '#444' },
  cardLabelSelected: { color: '#16A34A', fontWeight: '700' },
  cardDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  saveButton: { backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
