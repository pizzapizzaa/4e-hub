import { SyncStatusCard } from '@/components/admin/SyncStatus';
import { getSyncStatus, triggerSync } from '@/lib/api/admin';
import type { SyncStatus } from '@/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SyncScreen() {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  async function loadStatus() {
    setLoading(true);
    getSyncStatus().then(setStatus).finally(() => setLoading(false));
  }

  useEffect(() => { loadStatus(); }, []);

  async function handleTriggerSync() {
    setSyncing(true);
    try {
      await triggerSync();
      await loadStatus();
      Alert.alert('Sync complete', 'All connected apps are now up to date.');
    } catch {
      Alert.alert('Sync failed', 'Please check your connection and try again.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>App Sync</Text>
      <Text style={styles.subtitle}>
        Sync data between 4E Admin, 4E Learn & Play, and 4E In-Action.
      </Text>

      {loading
        ? <ActivityIndicator size="large" color="#16A34A" style={styles.loader} />
        : status && <SyncStatusCard status={status} />
      }

      {status?.connectedApps && status.connectedApps.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Apps</Text>
          {status.connectedApps.map((app) => (
            <View key={app} style={styles.appRow}>
              <View style={styles.dot} />
              <Text style={styles.appName}>{app}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
        onPress={handleTriggerSync}
        disabled={syncing}
      >
        {syncing
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.syncButtonText}>Trigger Manual Sync</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#16A34A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  loader: { marginTop: 40 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#666', textTransform: 'uppercase' },
  appRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  appName: { fontSize: 15, color: '#222' },
  syncButton: { backgroundColor: '#16A34A', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
