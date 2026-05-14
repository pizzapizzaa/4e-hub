// ─── Learn API ────────────────────────────────────────────────────────────────

import { authFetch } from '@/lib/api/client';
import { LearningPath, LearningTrailEntry, Lesson, LessonSession, QuizAttempt, QuizQuestion, QuizSession } from '@/types';

// ─── Lessons ──────────────────────────────────────────────────────────────────

export async function getLessons(programId: string, subject?: string): Promise<Lesson[]> {
  const params = new URLSearchParams({ programId, ...(subject ? { subject } : {}) });
  const res = await authFetch(`/api/learn/lessons?${params}`);
  if (!res.ok) throw new Error(`getLessons failed: ${res.status}`);
  return res.json() as Promise<Lesson[]>;
}

export async function getLesson(lessonId: string): Promise<Lesson> {
  const res = await authFetch(`/api/learn/lessons/${lessonId}`);
  if (!res.ok) throw new Error(`getLesson failed: ${res.status}`);
  return res.json() as Promise<Lesson>;
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

export async function startLessonSession(lessonId: string, studentId: string): Promise<LessonSession> {
  const res = await authFetch('/api/learn/sessions', {
    method: 'POST',
    body: JSON.stringify({ lessonId, studentId }),
  });
  if (!res.ok) throw new Error(`startLessonSession failed: ${res.status}`);
  return res.json() as Promise<LessonSession>;
}

export async function completeLessonSession(sessionId: string, score?: number): Promise<LessonSession> {
  const res = await authFetch(`/api/learn/sessions/${sessionId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ score }),
  });
  if (!res.ok) throw new Error(`completeLessonSession failed: ${res.status}`);
  return res.json() as Promise<LessonSession>;
}

// ─── Learning Trail ───────────────────────────────────────────────────────────

export async function getLearningTrail(studentId: string, subject?: string): Promise<LearningTrailEntry[]> {
  const params = new URLSearchParams({ studentId, ...(subject ? { subject } : {}) });
  const res = await authFetch(`/api/learn/trail?${params}`);
  if (!res.ok) throw new Error(`getLearningTrail failed: ${res.status}`);
  return res.json() as Promise<LearningTrailEntry[]>;
}

export async function getLearningPath(studentId: string, subject: string): Promise<LearningPath> {
  const res = await authFetch(`/api/learn/path?studentId=${studentId}&subject=${subject}`);
  if (!res.ok) throw new Error(`getLearningPath failed: ${res.status}`);
  return res.json() as Promise<LearningPath>;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export async function generateQuizSession(lessonId: string, studentId: string): Promise<{ session: QuizSession; questions: QuizQuestion[] }> {
  const res = await authFetch('/api/learn/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ lessonId, studentId }),
  });
  if (!res.ok) throw new Error(`generateQuizSession failed: ${res.status}`);
  return res.json() as Promise<{ session: QuizSession; questions: QuizQuestion[] }>;
}

export async function submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'isCorrect'>): Promise<QuizAttempt> {
  const res = await authFetch('/api/learn/quiz/attempt', {
    method: 'POST',
    body: JSON.stringify(attempt),
  });
  if (!res.ok) throw new Error(`submitQuizAttempt failed: ${res.status}`);
  return res.json() as Promise<QuizAttempt>;
}

export async function getQuizCollection(studentId: string, subject?: string): Promise<QuizSession[]> {
  const params = new URLSearchParams({ studentId, ...(subject ? { subject } : {}) });
  const res = await authFetch(`/api/learn/quiz/collection?${params}`);
  if (!res.ok) throw new Error(`getQuizCollection failed: ${res.status}`);
  return res.json() as Promise<QuizSession[]>;
}
