export type UserRole = 'super_admin' | 'district_admin' | 'school_admin' | 'teacher' | 'student' | 'guardian';
export type Subject = 'english' | 'maths' | 'science';
export type MaterialSource = 'khan_academy' | 'open_edx' | 'youtube' | 'custom';
export type TeachingMethod = 'direct_instruction' | 'inquiry_based' | 'flipped_classroom' | 'blended';

export interface School {
  id: string;
  districtId: string;
  name: string;
  address: string;
  adminIds: string[];
  teacherCount: number;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface LearningProgram {
  id: string;
  name: string;
  subject: Subject | string;
  level: string;
  description: string;
  materialSources: MaterialSource[];
  teachingMethod: TeachingMethod;
  isActive: boolean;
  schoolIds: string[];
  createdAt: string;
}

export interface Teacher {
  id: string;
  userId: string;
  schoolId: string;
  classIds: string[];
  subjectAreas: Subject[];
  qualifications?: string;
}

export interface Student {
  id: string;
  userId: string;
  schoolId: string;
  classIds: string[];
  graduationYear: number;
  learningPathId?: string;
  guardianIds: string[];
}

export interface SyncStatus {
  lastSyncedAt: string | null;
  isPending: boolean;
  error: string | null;
  pendingChanges: number;
  connectedApps: string[];
}

export interface MaterialsConfig {
  khanAcademy: { enabled: boolean; courseIds: string[] };
  openEdx:     { enabled: boolean; courseIds: string[] };
  youtube:     { enabled: boolean; playlistIds: string[] };
}
