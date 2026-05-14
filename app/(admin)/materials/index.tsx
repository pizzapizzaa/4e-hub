import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator, Alert } from 'react-native';
import { getMaterialsConfig, updateMaterialsConfig } from '@/lib/api/admin';
import { getSchoolId } from '@/lib/auth/session';
import type { MaterialsConfig } from '@/types';

export default function MaterialsScreen() {
  const [config, setConfig] = useState<MaterialsConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const schoolId = getSchoolId() ?? '';

  useEffect(() => {
    getMaterialsConfig(schoolId).then(setConfig).finally(() => setLoading(false));
  }, [schoolId]);

  async function toggleSource(source: keyof MaterialsConfig, enabled: boolean) {
    if (!config) return;
    const updated: MaterialsConfig = { ...config, [source]: { ...config[source], enabled } };
    setConfig(updated);
    try {
      await updateMaterialsConfig(schoolId, updated);
    } catch {
      Alert.alert('Error', 'Could not save materials configuration.');
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0F2D5A" />;
  if (!config) return <Text style={styles.error}>Could not load materials config.</Text>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Learning Materials</Text>
      <Text style={styles.subtitle}>Toggle material sources for this school.</Text>

      <SourceToggle
        label="Khan Academy (LTI)"
        description="Standards-aligned exercises and videos"
        enabled={config.khanAcademy.enabled}
        onToggle={(v) => toggleSource('khanAcademy', v)}
      />

      <SourceToggle
        label="Open edX"
        description="University-grade course content via API"
        enabled={config.openEdx.enabled}
        onToggle={(v) => toggleSource('openEdx', v)}
      />

      <SourceToggle
        label="YouTube (No-Cookie)"
        description="Curated educational video playlists"
        enabled={config.youtube.enabled}
        onToggle={(v) => toggleSource('youtube', v)}
      />
    </ScrollView>
  );
}

function SourceToggle({
  label, description, enabled, onToggle,
}: {
  label: string; description: string; enabled: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardText}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardDesc}>{description}</Text>
      </View>
      <Switch value={enabled} onValueChange={onToggle} trackColor={{ true: '#0F2D5A' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardText: { flex: 1, marginRight: 12 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#222' },
  cardDesc: { fontSize: 13, color: '#888', marginTop: 2 },
});
