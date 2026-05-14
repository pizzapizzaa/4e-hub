import type { LearningProgram, School, Student, SyncStatus, Teacher } from './types.js';

export const DEV_SCHOOLS: School[] = [
  { id: 'school-001', name: 'Greenfield Primary',  address: '12 Oak Avenue, Springfield',    districtId: 'district-dev-001', adminIds: ['dev-admin-001'], teacherCount: 3, studentCount: 4, isActive: true,  createdAt: '2024-01-01T00:00:00Z' },
  { id: 'school-002', name: 'Sunridge High',        address: '88 Hilltop Road, Shelbyville',  districtId: 'district-dev-001', adminIds: ['dev-admin-001'], teacherCount: 1, studentCount: 1, isActive: true,  createdAt: '2024-02-15T00:00:00Z' },
];

export const DEV_PROGRAMS: LearningProgram[] = [
  { id: 'prog-001', name: 'English Foundations', subject: 'english', level: 'primary',       description: 'Core literacy and reading comprehension for grades 1–6.', materialSources: ['youtube', 'custom'],   teachingMethod: 'blended',         isActive: true, schoolIds: ['school-001', 'school-002'], createdAt: '2024-01-10T00:00:00Z' },
  { id: 'prog-002', name: 'Maths Discovery',      subject: 'maths',   level: 'intermediate', description: 'Problem-solving and numeracy for grades 3–8.',              materialSources: ['khan_academy'],         teachingMethod: 'inquiry_based',   isActive: true, schoolIds: ['school-001'],              createdAt: '2024-03-01T00:00:00Z' },
  { id: 'prog-003', name: 'Science Explorers',    subject: 'science', level: 'primary',       description: 'Hands-on science and discovery for grades 2–5.',           materialSources: ['youtube', 'open_edx'], teachingMethod: 'flipped_classroom', isActive: false, schoolIds: ['school-002'],             createdAt: '2024-04-01T00:00:00Z' },
];

export const DEV_TEACHERS: Teacher[] = [
  { id: 'teacher-001', userId: 'user-t001', schoolId: 'school-001', classIds: ['cls-001', 'cls-002'], subjectAreas: ['english', 'science'] },
  { id: 'teacher-002', userId: 'user-t002', schoolId: 'school-001', classIds: ['cls-003'],            subjectAreas: ['maths'] },
  { id: 'teacher-003', userId: 'user-t003', schoolId: 'school-002', classIds: ['cls-004'],            subjectAreas: ['english'] },
  { id: 'teacher-004', userId: 'user-t004', schoolId: 'school-002', classIds: ['cls-005'],            subjectAreas: ['science', 'maths'] },
];

export const DEV_LEARNERS: Student[] = [
  { id: 'student-001', userId: 'user-s001', schoolId: 'school-001', classIds: ['cls-001'], graduationYear: 2028, guardianIds: [] },
  { id: 'student-002', userId: 'user-s002', schoolId: 'school-001', classIds: ['cls-001'], graduationYear: 2029, guardianIds: [] },
  { id: 'student-003', userId: 'user-s003', schoolId: 'school-001', classIds: ['cls-002'], graduationYear: 2027, guardianIds: [] },
  { id: 'student-004', userId: 'user-s004', schoolId: 'school-002', classIds: ['cls-004'], graduationYear: 2028, guardianIds: [] },
];

export const DEV_SYNC_STATUS: SyncStatus = {
  lastSyncedAt: new Date().toISOString(),
  isPending: false,
  error: null,
  pendingChanges: 0,
  connectedApps: ['4E Admin', '4E Learn & Play', '4E In-Action'],
};
