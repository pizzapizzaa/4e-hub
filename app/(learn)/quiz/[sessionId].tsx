import { QuizCard } from '@/components/learn/QuizCard';
import { generateQuizSession, submitQuizAttempt } from '@/lib/api/learn';
import { getCurrentUser } from '@/lib/auth/session';
import type { QuizQuestion, QuizSession } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function QuizSessionScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const user = getCurrentUser();

  const [quizSession, setQuizSession] = useState<QuizSession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // QA-03: validate route param early
  useEffect(() => {
    if (!sessionId) {
      router.replace('/(learn)/quiz/collection' as never);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!user || !sessionId) return;
    generateQuizSession(sessionId, user.id)
      .then(({ session, questions: qs }) => {
        setQuizSession(session);
        setQuestions(qs);
      })
      .finally(() => setLoading(false));
  }, [sessionId, user]);

  function handleAnswer(questionId: string, index: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: index }));
  }

  async function handleSubmit() {
    if (!user || !quizSession) return;
    if (Object.keys(answers).length < questions.length) {
      Alert.alert('Not done yet', 'Please answer all questions before submitting.');
      return;
    }

    const resultMap: Record<string, boolean> = {};
    await Promise.all(
      questions.map(async (q) => {
        const attempt = await submitQuizAttempt({
          questionId: q.id,
          sessionId: quizSession.id,
          studentId: user.id,
          selectedIndex: answers[q.id]!,
          attemptedAt: new Date().toISOString(),
        });
        resultMap[q.id] = attempt.isCorrect;
      }),
    );

    setResults(resultMap);
    setSubmitted(true);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#0F2D5A" />;

  const correct = Object.values(results).filter(Boolean).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Quiz</Text>

      {submitted && (
        <View style={styles.scoreBanner}>
          <Text style={styles.scoreText}>{correct} / {questions.length} correct 🎉</Text>
        </View>
      )}

      {questions.map((q, i) => (
        <QuizCard
          key={q.id}
          question={q}
          questionNumber={i + 1}
          selectedIndex={answers[q.id] ?? null}
          isCorrect={submitted ? results[q.id] : undefined}
          onSelect={(idx) => handleAnswer(q.id, idx)}
        />
      ))}

      {!submitted && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Quiz</Text>
        </TouchableOpacity>
      )}

      {submitted && (
        <TouchableOpacity style={styles.doneButton} onPress={() => router.push('/(learn)/trail' as never)}>
          <Text style={styles.doneButtonText}>View My Trail</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { padding: 20, paddingTop: 60, gap: 16 },
  heading: { fontSize: 26, fontWeight: '800', color: '#0F2D5A' },
  scoreBanner: { backgroundColor: '#D1FAE5', borderRadius: 12, padding: 18, alignItems: 'center' },
  scoreText: { fontSize: 20, fontWeight: '800', color: '#059669' },
  submitButton: { backgroundColor: '#0F2D5A', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneButton: { backgroundColor: '#2563EB', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
