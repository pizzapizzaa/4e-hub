import { BroadcastControl } from '@/components/inaction/BroadcastControl';
import { endBroadcast, getTeacherClasses, startBroadcast } from '@/lib/api/inaction';
import { getCurrentUser } from '@/lib/auth/session';
import type { BroadcastSession, Class } from '@/types';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// Allowlist of permitted video hosts (SEC-07)
const ALLOWED_VIDEO_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'youtu.be']);

function isAllowedVideoUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_VIDEO_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export default function BroadcastScreen() {
  const user = getCurrentUser();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [activeSession, setActiveSession] = useState<BroadcastSession | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) getTeacherClasses(user.id).then(setClasses);
  }, [user]);

  async function handleStart() {
    if (!selectedClassId || !videoUrl.trim()) {
      Alert.alert('Missing info', 'Please select a class and enter a video URL.');
      return;
    }
    // Validate URL host against allowlist (SEC-07)
    if (!isAllowedVideoUrl(videoUrl.trim())) {
      Alert.alert('Invalid URL', 'Only YouTube links are supported for broadcast.');
      return;
    }
    setLoading(true);
    try {
      const session = await startBroadcast(selectedClassId, videoUrl.trim());
      setActiveSession(session);
    } catch {
      Alert.alert('Error', 'Could not start broadcast. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleEnd() {
    if (!activeSession) return;
    setLoading(true);
    try {
      await endBroadcast(activeSession.id);
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>📡 Video Broadcast</Text>
      <Text style={styles.subtitle}>Stream a video directly to all student screens in your class.</Text>

      {activeSession ? (
        <BroadcastControl session={activeSession} onEnd={handleEnd} loading={loading} />
      ) : (
        <>
          <Text style={styles.label}>Select Class</Text>
          <View style={styles.classGrid}>
            {classes.map((cls) => (
              <TouchableOpacity
                key={cls.id}
                style={[styles.classChip, selectedClassId === cls.id && styles.classChipSelected]}
                onPress={() => setSelectedClassId(cls.id)}
              >
                <Text style={[styles.classChipText, selectedClassId === cls.id && styles.classChipTextSelected]}>
                  {cls.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Video URL (YouTube or direct)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://www.youtube.com/watch?v=..."
            placeholderTextColor="#999"
            value={videoUrl}
            onChangeText={setVideoUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.startButton, loading && styles.buttonDisabled]}
            onPress={handleStart}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.startButtonText}>Start Broadcast</Text>
            }
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 14 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F2D5A', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666' },
  label: { fontSize: 14, fontWeight: '700', color: '#444', marginTop: 4 },
  classGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  classChip: { borderRadius: 10, borderWidth: 2, borderColor: '#DDD', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff' },
  classChipSelected: { borderColor: '#0F2D5A', backgroundColor: '#0F2D5A' },
  classChipText: { fontWeight: '600', color: '#444' },
  classChipTextSelected: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#DDD', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, backgroundColor: '#fff', color: '#222' },
  startButton: { backgroundColor: '#DC2626', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  buttonDisabled: { opacity: 0.6 },
  startButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
