import { DEV_BROADCAST_SESSIONS, DEV_CLASSES, DEV_LEARNERS, DEV_PROGRAMS, DEV_SCHOOLS, DEV_SYNC_STATUS, DEV_TEACHER_MEMOIR, DEV_TEACHERS } from './mock-data.js';
import type { LearningProgram, MaterialsConfig, School, Student, SyncStatus, Teacher } from './types.js';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
export const IS_MOCK = !API_URL;

// ── Token storage ─────────────────────────────────────────────────────────────
export function getToken(): string | null         { return sessionStorage.getItem('access_token'); }
export function setToken(t: string): void         { sessionStorage.setItem('access_token', t); }
export function clearToken(): void                { sessionStorage.removeItem('access_token'); }
export function getRefreshToken(): string | null  { return sessionStorage.getItem('refresh_token'); }
export function setRefreshToken(t: string): void  { sessionStorage.setItem('refresh_token', t); }
export function getExpiresAt(): number            { return parseInt(sessionStorage.getItem('expires_at') ?? '0', 10); }
export function setExpiresAt(t: number): void     { sessionStorage.setItem('expires_at', String(t)); }

/** Returns true if the access token is missing or within 60 s of expiry. */
export function isTokenExpired(): boolean {
  const exp = getExpiresAt();
  return exp === 0 || Date.now() >= (exp - 60) * 1000;
}

export function clearAuth(): void {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('expires_at');
}

/** Silent token refresh. Returns true on success. */
export async function attemptTokenRefresh(): Promise<boolean> {
  if (!API_URL) return false;
  const rt = getRefreshToken();
  if (!rt) return false;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    });
    if (!res.ok) return false;
    const data = await res.json() as { accessToken: string; refreshToken: string; expiresAt: number };
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setExpiresAt(data.expiresAt);
    return true;
  } catch {
    return false;
  }
}

// ── Core fetch ────────────────────────────────────────────────────────────────
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) throw new Error(`${path} → ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

function devOrFetch<T>(mock: T, fetcher: () => Promise<T>): Promise<T> {
  return IS_MOCK ? Promise.resolve(mock) : fetcher();
}

// ── Schools ───────────────────────────────────────────────────────────────────
export const getSchools  = (): Promise<School[]>  => devOrFetch(DEV_SCHOOLS,  () => apiFetch('/api/admin/schools'));
export const getSchool   = (id: string): Promise<School> =>
  devOrFetch(DEV_SCHOOLS.find(s => s.id === id) ?? DEV_SCHOOLS[0], () => apiFetch(`/api/admin/schools/${id}`));
export const createSchool = (data: { name: string; address: string; districtId: string }): Promise<School> =>
  IS_MOCK
    ? Promise.reject(new Error('Not available in mock mode'))
    : apiFetch('/api/admin/schools', { method: 'POST', body: JSON.stringify(data) });

export const updateSchool = (id: string, data: { name?: string; address?: string; districtId?: string; isActive?: boolean }): Promise<School> =>
  IS_MOCK
    ? Promise.reject(new Error('Not available in mock mode'))
    : apiFetch(`/api/admin/schools/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export function getCurrentUserEmail(): string | null {
  const token = sessionStorage.getItem('access_token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.email === 'string' ? payload.email : null;
  } catch {
    return null;
  }
}

export function getCurrentUser(): { email?: string; role?: string; userId?: string; schoolIds?: string[] } | null {
  const token = sessionStorage.getItem('access_token');
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return {
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: typeof payload.role === 'string' ? payload.role : undefined,
      userId: typeof payload.userId === 'string' ? payload.userId : (typeof payload.sub === 'string' ? payload.sub : undefined),
      schoolIds: Array.isArray(payload.schoolIds) ? payload.schoolIds : (payload.schoolId ? [payload.schoolId] : []),
    };
  } catch {
    return null;
  }
}

// ── Programs ──────────────────────────────────────────────────────────────────
export const getPrograms = (): Promise<LearningProgram[]> => devOrFetch(DEV_PROGRAMS, () => apiFetch('/api/admin/programs'));
export const createProgram = (data: {
  name: string; subject: string; level: string; description: string;
  teachingMethod: string;
}): Promise<LearningProgram> =>
  IS_MOCK
    ? Promise.reject(new Error('Not available in mock mode'))
    : apiFetch('/api/admin/programs', { method: 'POST', body: JSON.stringify(data) });

// Allow createProgram with optional schoolIds (used by teacher flow)
export const createProgramWithSchools = (data: {
  name: string; subject: string; level: string; description: string; teachingMethod: string; schoolIds?: string[]
}): Promise<LearningProgram> =>
  IS_MOCK
    ? Promise.reject(new Error('Not available in mock mode'))
    : apiFetch('/api/admin/programs', { method: 'POST', body: JSON.stringify(data) });

// ── Teachers ──────────────────────────────────────────────────────────────────
export const getTeachers = (schoolId?: string): Promise<Teacher[]> => {
  const mock = schoolId ? DEV_TEACHERS.filter(t => t.schoolId === schoolId) : DEV_TEACHERS;
  return devOrFetch(mock, () => apiFetch(`/api/admin/teachers${schoolId ? `?schoolId=${schoolId}` : ''}`));
};

export const createTeacher = (data: { fullName: string; email: string; password: string; schoolIds: string[] }): Promise<any> =>
  IS_MOCK
    ? new Promise((resolve) => {
        const id = `teacher-${String(Math.floor(Math.random()*900000)+100000)}`;
        const userId = `user-${id}`;
        const [firstSchool] = data.schoolIds;
        DEV_TEACHERS.push({ id, userId, schoolId: firstSchool, classIds: [], subjectAreas: [] });
        // bump school counts
        for (const s of data.schoolIds) {
          const sc = DEV_SCHOOLS.find(x => x.id === s);
          if (sc) sc.teacherCount += 1;
        }
        resolve({ id, userId, email: data.email, schoolIds: data.schoolIds });
      })
    : apiFetch('/api/admin/teachers', { method: 'POST', body: JSON.stringify(data) });

export const generateOnboardingToken = (data: { userId?: string; email?: string }): Promise<{ token: string }> =>
  IS_MOCK
    ? Promise.resolve({ token: 'mock-onboard-token' })
    : apiFetch('/api/admin/teachers/onboard', { method: 'POST', body: JSON.stringify(data) });

export const setOnboardPassword = (data: { token: string; password: string }): Promise<any> =>
  IS_MOCK
    ? Promise.resolve({ ok: true })
    : apiFetch('/api/auth/onboard-set-password', { method: 'POST', body: JSON.stringify(data) });

// ── Learners ──────────────────────────────────────────────────────────────────
export const getLearners = (schoolId?: string): Promise<Student[]> => {
  const mock = schoolId ? DEV_LEARNERS.filter(s => s.schoolId === schoolId) : DEV_LEARNERS;
  return devOrFetch(mock, () => apiFetch(`/api/admin/learners${schoolId ? `?schoolId=${schoolId}` : ''}`));
};

// ── In-Action (teacher tools) ─────────────────────────────────────────────────
export const getTeacherClasses = (teacherId: string): Promise<any[]> => {
  const mock = DEV_CLASSES.filter(c => c.teacherId === teacherId);
  return devOrFetch(mock, () => apiFetch(`/api/inaction/classes?teacherId=${teacherId}`));
};

export const getClassStudents = (classId: string): Promise<Student[]> => {
  const mock = DEV_LEARNERS.filter(s => s.classIds.includes(classId));
  return devOrFetch(mock, () => apiFetch(`/api/inaction/classes/${classId}/students`));
};

export const getBroadcastSessions = (teacherId?: string): Promise<any[]> => {
  const mock = teacherId ? DEV_BROADCAST_SESSIONS.filter(b => b.teacherId === teacherId) : DEV_BROADCAST_SESSIONS;
  return devOrFetch(mock, () => apiFetch(`/api/inaction/broadcasts${teacherId ? `?teacherId=${teacherId}` : ''}`));
};

export const startBroadcast = (classId: string, message: string): Promise<any> => {
  if (IS_MOCK) {
    const newB = { id: `bs-${String(Math.floor(Math.random()*900)+100)}`, classId, teacherId: 'unknown', startedAt: new Date().toISOString(), endedAt: null, message };
    DEV_BROADCAST_SESSIONS.push(newB);
    return Promise.resolve(newB);
  }
  return apiFetch('/api/inaction/broadcast/start', { method: 'POST', body: JSON.stringify({ classId, message }) });
};

export const getMemoirs = (teacherId: string, studentId?: string): Promise<any[]> => {
  const mock = DEV_TEACHER_MEMOIR.filter(m => m.teacherId === teacherId && (!studentId || m.studentId === studentId));
  return devOrFetch(mock, () => apiFetch(`/api/inaction/memoir?teacherId=${teacherId}${studentId ? `&studentId=${studentId}` : ''}`));
};

export const createMemoir = (data: { teacherId: string; studentId?: string; note: string }): Promise<any> => {
  if (IS_MOCK) {
    const newM = { id: `m-${String(Math.floor(Math.random()*900)+100)}`, teacherId: data.teacherId, studentId: data.studentId ?? '', note: data.note, createdAt: new Date().toISOString() };
    DEV_TEACHER_MEMOIR.push(newM);
    return Promise.resolve(newM);
  }
  return apiFetch('/api/inaction/memoir', { method: 'POST', body: JSON.stringify(data) });
};

// ── Sync ──────────────────────────────────────────────────────────────────────
export const getSyncStatus = (): Promise<SyncStatus> => devOrFetch(DEV_SYNC_STATUS, () => apiFetch('/api/admin/sync/status'));
export const triggerSync   = (): Promise<void>        => IS_MOCK
  ? new Promise(r => setTimeout(r, 800))
  : apiFetch('/api/admin/sync/trigger', { method: 'POST' });

// ── Materials ─────────────────────────────────────────────────────────────────
const DEV_MATERIALS_CONFIG: MaterialsConfig = {
  khanAcademy: { enabled: true,  courseIds: ['khan-math-101', 'khan-sci-201'] },
  openEdx:     { enabled: false, courseIds: [] },
  youtube:     { enabled: true,  playlistIds: ['PLexample123'] },
};

export const getMaterialsConfig = (schoolId: string): Promise<MaterialsConfig> =>
  devOrFetch(DEV_MATERIALS_CONFIG, () => apiFetch(`/api/admin/materials/${schoolId}`));

export const updateMaterialsConfig = (schoolId: string, config: MaterialsConfig): Promise<void> =>
  IS_MOCK
    ? new Promise(r => setTimeout(r, 400))
    : apiFetch(`/api/admin/materials/${schoolId}`, { method: 'PUT', body: JSON.stringify(config) });

export const getTeacherMaterials = (): Promise<any[]> =>
  IS_MOCK ? Promise.resolve([]) : apiFetch('/api/teacher/materials');

export const addTeacherMaterial = (data: { title: string; url: string; type?: string }): Promise<any> =>
  IS_MOCK ? Promise.resolve({ id: 'm-mock', ...data }) : apiFetch('/api/teacher/materials', { method: 'POST', body: JSON.stringify(data) });
