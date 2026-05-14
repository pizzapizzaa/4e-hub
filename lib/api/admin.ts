// ─── Admin API ────────────────────────────────────────────────────────────────
// All calls go through your backend — never directly to Turso/TiDB from the app.

import { authFetch } from '@/lib/api/client';
import { LearningProgram, MaterialsConfig, School, Student, SyncStatus, Teacher } from '@/types';

// ─── Dev mock interception ────────────────────────────────────────────────────
// When no backend URL is configured (local UI dev), every function returns
// in-memory fixture data instead of hitting the network.

const IS_DEV_MOCK = !process.env.EXPO_PUBLIC_API_URL;

async function devOrFetch<T>(mockValue: T, fetcher: () => Promise<T>): Promise<T> {
  if (IS_DEV_MOCK) return mockValue;
  return fetcher();
}

import {
    DEV_LEARNERS,
    DEV_PROGRAMS,
    DEV_SCHOOLS,
    DEV_SYNC_STATUS,
    DEV_TEACHERS,
} from '@/lib/dev/mock-data';

// ─── Programs ─────────────────────────────────────────────────────────────────

export async function getPrograms(): Promise<LearningProgram[]> {
  return devOrFetch(DEV_PROGRAMS, async () => {
    const res = await authFetch('/api/admin/programs');
    if (!res.ok) throw new Error(`getPrograms failed: ${res.status}`);
    return res.json() as Promise<LearningProgram[]>;
  });
}

export async function createProgram(data: Omit<LearningProgram, 'id' | 'createdAt'>): Promise<LearningProgram> {
  const res = await authFetch('/api/admin/programs', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`createProgram failed: ${res.status}`);
  return res.json() as Promise<LearningProgram>;
}

export async function updateProgram(id: string, data: Partial<LearningProgram>): Promise<LearningProgram> {
  const res = await authFetch(`/api/admin/programs/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`updateProgram failed: ${res.status}`);
  return res.json() as Promise<LearningProgram>;
}

// ─── Schools ──────────────────────────────────────────────────────────────────

export async function getSchools(): Promise<School[]> {
  return devOrFetch(DEV_SCHOOLS, async () => {
    const res = await authFetch('/api/admin/schools');
    if (!res.ok) throw new Error(`getSchools failed: ${res.status}`);
    return res.json() as Promise<School[]>;
  });
}

export async function getSchool(id: string): Promise<School> {
  return devOrFetch(
    DEV_SCHOOLS.find((s) => s.id === id) ?? DEV_SCHOOLS[0],
    async () => {
      const res = await authFetch(`/api/admin/schools/${id}`);
      if (!res.ok) throw new Error(`getSchool failed: ${res.status}`);
      return res.json() as Promise<School>;
    },
  );
}

export async function createSchool(data: Omit<School, 'id' | 'createdAt' | 'teacherCount' | 'studentCount'>): Promise<School> {
  const res = await authFetch('/api/admin/schools', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error(`createSchool failed: ${res.status}`);
  return res.json() as Promise<School>;
}

// ─── Teachers ─────────────────────────────────────────────────────────────────

export async function getTeachers(schoolId?: string): Promise<Teacher[]> {
  const filtered = schoolId ? DEV_TEACHERS.filter((t) => t.schoolId === schoolId) : DEV_TEACHERS;
  return devOrFetch(filtered, async () => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    const res = await authFetch(`/api/admin/teachers${query}`);
    if (!res.ok) throw new Error(`getTeachers failed: ${res.status}`);
    return res.json() as Promise<Teacher[]>;
  });
}

// ─── Learners ─────────────────────────────────────────────────────────────────

export async function getLearners(schoolId?: string): Promise<Student[]> {
  const filtered = schoolId ? DEV_LEARNERS.filter((s) => s.schoolId === schoolId) : DEV_LEARNERS;
  return devOrFetch(filtered, async () => {
    const query = schoolId ? `?schoolId=${schoolId}` : '';
    const res = await authFetch(`/api/admin/learners${query}`);
    if (!res.ok) throw new Error(`getLearners failed: ${res.status}`);
    return res.json() as Promise<Student[]>;
  });
}

// ─── Materials Config ─────────────────────────────────────────────────────────

export async function getMaterialsConfig(schoolId: string): Promise<MaterialsConfig> {
  const res = await authFetch(`/api/admin/materials/${schoolId}`);
  if (!res.ok) throw new Error(`getMaterialsConfig failed: ${res.status}`);
  return res.json() as Promise<MaterialsConfig>;
}

export async function updateMaterialsConfig(schoolId: string, config: MaterialsConfig): Promise<void> {
  const res = await authFetch(`/api/admin/materials/${schoolId}`, { method: 'PUT', body: JSON.stringify(config) });
  if (!res.ok) throw new Error(`updateMaterialsConfig failed: ${res.status}`);
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export async function getSyncStatus(): Promise<SyncStatus> {
  return devOrFetch(DEV_SYNC_STATUS, async () => {
    const res = await authFetch('/api/admin/sync/status');
    if (!res.ok) throw new Error(`getSyncStatus failed: ${res.status}`);
    return res.json() as Promise<SyncStatus>;
  });
}

export async function triggerSync(): Promise<void> {
  if (IS_DEV_MOCK) { await new Promise((r) => setTimeout(r, 800)); return; }
  const res = await authFetch('/api/admin/sync/trigger', { method: 'POST' });
  if (!res.ok) throw new Error(`triggerSync failed: ${res.status}`);
}
