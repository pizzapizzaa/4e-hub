// ─── In-Action API (Teacher Tools) ───────────────────────────────────────────

import { authFetch } from '@/lib/api/client';
import { BroadcastSession, Class, Student, TeacherMemoir } from '@/types';

// ─── Classes ──────────────────────────────────────────────────────────────────

export async function getTeacherClasses(teacherId: string): Promise<Class[]> {
  const res = await authFetch(`/api/inaction/classes?teacherId=${teacherId}`);
  if (!res.ok) throw new Error(`getTeacherClasses failed: ${res.status}`);
  return res.json() as Promise<Class[]>;
}

export async function getClass(classId: string): Promise<Class> {
  const res = await authFetch(`/api/inaction/classes/${classId}`);
  if (!res.ok) throw new Error(`getClass failed: ${res.status}`);
  return res.json() as Promise<Class>;
}

// ─── Students ─────────────────────────────────────────────────────────────────

export async function getClassStudents(classId: string): Promise<Student[]> {
  const res = await authFetch(`/api/inaction/classes/${classId}/students`);
  if (!res.ok) throw new Error(`getClassStudents failed: ${res.status}`);
  return res.json() as Promise<Student[]>;
}

export async function getStudent(studentId: string): Promise<Student> {
  const res = await authFetch(`/api/inaction/students/${studentId}`);
  if (!res.ok) throw new Error(`getStudent failed: ${res.status}`);
  return res.json() as Promise<Student>;
}

// ─── Teacher's Memoir ─────────────────────────────────────────────────────────

export async function getMemoirs(teacherId: string, studentId?: string): Promise<TeacherMemoir[]> {
  const params = new URLSearchParams({ teacherId, ...(studentId ? { studentId } : {}) });
  const res = await authFetch(`/api/inaction/memoir?${params}`);
  if (!res.ok) throw new Error(`getMemoirs failed: ${res.status}`);
  return res.json() as Promise<TeacherMemoir[]>;
}

export async function createMemoir(
  data: Omit<TeacherMemoir, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<TeacherMemoir> {
  const res = await authFetch('/api/inaction/memoir', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`createMemoir failed: ${res.status}`);
  return res.json() as Promise<TeacherMemoir>;
}

export async function updateMemoir(id: string, data: Partial<TeacherMemoir>): Promise<TeacherMemoir> {
  const res = await authFetch(`/api/inaction/memoir/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`updateMemoir failed: ${res.status}`);
  return res.json() as Promise<TeacherMemoir>;
}

// ─── Broadcast ────────────────────────────────────────────────────────────────

export async function startBroadcast(classId: string, videoUrl: string): Promise<BroadcastSession> {
  const res = await authFetch('/api/inaction/broadcast/start', {
    method: 'POST',
    body: JSON.stringify({ classId, videoUrl }),
  });
  if (!res.ok) throw new Error(`startBroadcast failed: ${res.status}`);
  return res.json() as Promise<BroadcastSession>;
}

export async function endBroadcast(sessionId: string): Promise<void> {
  const res = await authFetch(`/api/inaction/broadcast/${sessionId}/end`, { method: 'POST' });
  if (!res.ok) throw new Error(`endBroadcast failed: ${res.status}`);
}
