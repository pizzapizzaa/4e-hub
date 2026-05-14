import type { SyncStatus } from '@/types';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
  status: SyncStatus;
  onTrigger?: () => void;
  triggering?: boolean;
}

export function SyncStatusCard({ status, onTrigger, triggering }: Props) {
  const isSyncing = status.isPending;
  const hasError = !!status.error;
  const statusColor = hasError ? '#DC2626' : isSyncing ? '#D97706' : '#059669';
  const statusLabel = hasError ? '❌ Error' : isSyncing ? '🔄 Syncing…' : '✅ Synced';

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.heading}>Sync Status</Text>
        <Text style={[styles.statusBadge, { color: statusColor }]}>{statusLabel}</Text>
      </View>
      <Text style={styles.meta}>Last sync: {status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never'}</Text>
      {status.pendingChanges > 0 && (
        <Text style={styles.pending}>{status.pendingChanges} item(s) pending sync</Text>
      )}
      {onTrigger && (
        <TouchableOpacity style={styles.button} onPress={onTrigger} disabled={triggering}>
          {triggering ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.buttonText}>Sync Now</Text>}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 15, fontWeight: '700', color: '#333' },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 12, color: '#888' },
  pending: { fontSize: 13, color: '#D97706', fontWeight: '600' },
  button: { marginTop: 4, backgroundColor: '#16A34A', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
