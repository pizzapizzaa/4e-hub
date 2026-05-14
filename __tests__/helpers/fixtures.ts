// ─── Test utilities shared by admin tests ─────────────────────────────────────

import type { LearningProgram, School, SyncStatus, User } from '@/types';

export const mockUser: User = {
  id: 'user-001',
  email: 'admin@e4hub.test',
  role: 'school_admin',
  schoolId: 'school-001',
  districtId: 'district-001',
  tenantId: 'tenant-001',
  firstName: 'Alice',
  lastName: 'Admin',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
};

export const mockSchools: School[] = [
  {
    id: 'school-001',
    districtId: 'district-001',
    name: 'Springfield Elementary',
    address: '123 Main St',
    adminIds: ['user-001'],
    teacherCount: 12,
    studentCount: 240,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'school-002',
    districtId: 'district-001',
    name: 'Shelbyville Middle',
    address: '456 Elm Ave',
    adminIds: [],
    teacherCount: 8,
    studentCount: 180,
    isActive: true,
    createdAt: '2024-02-01T00:00:00Z',
  },
];

export const mockPrograms: LearningProgram[] = [
  {
    id: 'prog-001',
    name: 'English Foundations',
    subject: 'english',
    level: 'beginner',
    description: 'ESL basics',
    materialSources: ['youtube'],
    teachingMethod: 'direct_instruction',
    isActive: true,
    schoolIds: ['school-001'],
    createdAt: '2024-01-01T00:00:00Z',
  },
];

export const mockSyncStatus: SyncStatus = {
  lastSyncedAt: '2026-05-13T10:00:00Z',
  isPending: false,
  error: null,
  pendingChanges: 0,
  connectedApps: ['khan_academy', 'youtube'],
};
