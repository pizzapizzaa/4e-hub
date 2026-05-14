import { DEV_LEARNERS, DEV_PROGRAMS, DEV_SCHOOLS, DEV_SYNC_STATUS, DEV_TEACHERS } from './mock-data.js';
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

// ── Programs ──────────────────────────────────────────────────────────────────
export const getPrograms = (): Promise<LearningProgram[]> => devOrFetch(DEV_PROGRAMS, () => apiFetch('/api/admin/programs'));
export const createProgram = (data: {
  name: string; subject: string; level: string; description: string;
  teachingMethod: string;
}): Promise<LearningProgram> =>
  IS_MOCK
    ? Promise.reject(new Error('Not available in mock mode'))
    : apiFetch('/api/admin/programs', { method: 'POST', body: JSON.stringify(data) });

// ── Teachers ──────────────────────────────────────────────────────────────────
export const getTeachers = (schoolId?: string): Promise<Teacher[]> => {
  const mock = schoolId ? DEV_TEACHERS.filter(t => t.schoolId === schoolId) : DEV_TEACHERS;
  return devOrFetch(mock, () => apiFetch(`/api/admin/teachers${schoolId ? `?schoolId=${schoolId}` : ''}`));
};

// ── Learners ──────────────────────────────────────────────────────────────────
export const getLearners = (schoolId?: string): Promise<Student[]> => {
  const mock = schoolId ? DEV_LEARNERS.filter(s => s.schoolId === schoolId) : DEV_LEARNERS;
  return devOrFetch(mock, () => apiFetch(`/api/admin/learners${schoolId ? `?schoolId=${schoolId}` : ''}`));
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
