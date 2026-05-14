import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { BroadcastSession } from '@/types';
import { buildRoomId } from '@/lib/integrations/liveblocks';

interface Props {
  session: BroadcastSession;
  onEnd: () => void;
  loading?: boolean;
}

export function BroadcastControl({ session, onEnd, loading }: Props) {
  const roomId = buildRoomId(session.classId, session.id);

  return (
    <View style={styles.container}>
      <View style={styles.liveBadge}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      <Text style={styles.heading}>Broadcast Active</Text>
      <Text style={styles.roomId}>Room: {roomId}</Text>
      <Text style={styles.videoUrl} numberOfLines={1}>▶ {session.videoUrl}</Text>

      <Text style={styles.hint}>Students in your class can now see this video on their screens.</Text>

      <TouchableOpacity
        style={[styles.endButton, loading && styles.buttonDisabled]}
        onPress={onEnd}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.endButtonText}>⏹ End Broadcast</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 16, padding: 22, gap: 12, borderWidth: 2, borderColor: '#DC2626', shadowColor: '#DC2626', shadowOpacity: 0.15, shadowRadius: 12, elevation: 4 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FEE2E2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DC2626' },
  liveText: { fontSize: 12, fontWeight: '800', color: '#DC2626', letterSpacing: 1 },
  heading: { fontSize: 20, fontWeight: '800', color: '#222' },
  roomId: { fontSize: 12, color: '#888', fontFamily: 'monospace' },
  videoUrl: { fontSize: 13, color: '#555' },
  hint: { fontSize: 13, color: '#666', fontStyle: 'italic' },
  endButton: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.6 },
  endButtonText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
