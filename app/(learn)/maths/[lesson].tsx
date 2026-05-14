import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { getLesson, startLessonSession, completeLessonSession } from '@/lib/api/learn';
import { buildNoCookieEmbedUrl } from '@/lib/integrations/youtube';
import { getCurrentUser } from '@/lib/auth/session';
import type { Lesson, LessonSession } from '@/types';

export default function MathsLessonScreen() {
  const { lesson: lessonId } = useLocalSearchParams<{ lesson: string }>();
  const router = useRouter();
  const user = getCurrentUser();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [session, setSession] = useState<LessonSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const l = await getLesson(lessonId!);
      setLesson(l);
      if (user) {
        const s = await startLessonSession(l.id, user.id);
        setSession(s);
      }
      setLoading(false);
    }
    load().catch(() => setLoading(false));
  }, [lessonId, user]);

  async function handleComplete() {
    if (!session) return;
    await completeLessonSession(session.id);
    Alert.alert(
      'Well done! 🔢',
      'Ready for a quick quiz on this lesson?',
      [
        { text: 'Not now', onPress: () => router.back() },
        { text: 'Take Quiz', onPress: () => router.push(`/(learn)/quiz/${session.id}` as never) },
      ],
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7C3AED" />;
  if (!lesson) return <Text style={styles.error}>Lesson not found.</Text>;

  const videoUrl = lesson.videoUrl ? buildNoCookieEmbedUrl(lesson.videoUrl) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>{lesson.title}</Text>
      <Text style={styles.meta}>{lesson.durationMinutes} min · Maths</Text>

      {videoUrl && (
        <View style={styles.videoContainer}>
          <WebView source={{ uri: videoUrl }} style={styles.video} allowsFullscreenVideo />
        </View>
      )}

      <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
        <Text style={styles.completeButtonText}>Mark Complete & Take Quiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  error: { textAlign: 'center', marginTop: 80, color: '#999', fontSize: 16 },
  heading: { fontSize: 24, fontWeight: '800', color: '#7C3AED' },
  meta: { fontSize: 13, color: '#888' },
  videoContainer: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  video: { flex: 1 },
  completeButton: { backgroundColor: '#7C3AED', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  completeButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
