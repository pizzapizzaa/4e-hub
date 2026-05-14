// ─── Core Domain Types for E4-Hub ────────────────────────────────────────────

export type UserRole =
  | 'super_admin'
  | 'district_admin'
  | 'school_admin'
  | 'teacher'
  | 'student'
  | 'guardian';

export type Subject = 'english' | 'maths' | 'science' | 'bouldering';

export type MaterialSource = 'khan_academy' | 'open_edx' | 'youtube' | 'custom';

export type TeachingMethod = 'direct_instruction' | 'inquiry_based' | 'flipped_classroom' | 'blended';

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  role: UserRole;
  additionalRoles?: UserRole[]; // accounts that can operate in multiple roles
  schoolId: string;
  districtId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  createdAt: string;
  graduationYear?: number; // students only
  isActive: boolean;
}

// ─── Organisation ─────────────────────────────────────────────────────────────

export interface District {
  id: string;
  name: string;
  region: string;
  country: string;
  adminIds: string[];
  tursoDbName: string; // one Turso DB per district — NEVER send to clients
  createdAt: string;
}

// Safe client-facing DTO — strips sensitive infrastructure fields (SEC-10)
export type DistrictPublic = Omit<District, 'tursoDbName' | 'adminIds'>;

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

// ─── Programs & Curriculum ────────────────────────────────────────────────────

export interface LearningProgram {
  id: string;
  name: string;
  subject: Subject | string;
  level: string;
  description: string;
  materialSources: MaterialSource[];
  teachingMethod: TeachingMethod;
  isActive: boolean;
  schoolIds: string[]; // which schools use this
  createdAt: string;
}

export interface Lesson {
  id: string;
  programId: string;
  title: string;
  subject: Subject;
  order: number;
  videoUrl?: string; // YouTube URL
  khanActivityId?: string;
  openEdxCourseId?: string;
  durationMinutes: number;
}

// ─── Classes & People ─────────────────────────────────────────────────────────

export interface Class {
  id: string;
  schoolId: string;
  teacherId: string;
  name: string;
  subject: Subject;
  studentIds: string[];
  programId: string;
  academicYear: string;
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

// ─── Learning Activity ────────────────────────────────────────────────────────

export interface LessonSession {
  id: string;
  studentId: string;
  schoolId: string;        // RLS anchor
  programId: string;
  subject: Subject;
  lessonId: string;
  startedAt: string;
  completedAt?: string;
  score?: number;
  quizSessionId?: string;
}

export interface LearningTrailEntry {
  id: string;
  studentId: string;
  schoolId: string;        // RLS anchor
  subject: Subject;
  lessonId: string;
  lessonTitle: string;
  completedAt: string;
  score?: number;
  durationMinutes?: number;
}

export interface LearningPath {
  id: string;
  studentId: string;
  subject: Subject;
  currentLessonId: string;
  completedLessonIds: string[];
  progressPercent: number;
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export interface QuizSession {
  id: string;
  studentId: string;
  lessonId: string;
  subject: Subject;
  generatedAt: string;
  completedAt?: string;
  totalQuestions: number;
  correctAnswers?: number;
}

export interface QuizQuestion {
  id: string;
  sessionId: string;
  question: string;
  options: string[];
  correctIndex: number;
  subject: Subject;
  lessonId: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface QuizAttempt {
  id: string;
  questionId: string;
  sessionId: string;
  studentId: string;
  schoolId: string;        // RLS anchor
  selectedIndex: number;
  isCorrect: boolean;
  attemptedAt: string;
}

// ─── Teaching Tools ───────────────────────────────────────────────────────────

export interface BroadcastSession {
  id: string;
  teacherId: string;
  schoolId: string;        // RLS anchor
  classId: string;
  videoUrl: string;
  isLive: boolean;
  startedAt: string;
  endedAt?: string;
  liveblocksRoomId: string;
}

export interface TeacherMemoir {
  id: string;
  teacherId: string;
  schoolId: string;        // RLS anchor
  studentId: string;
  classId: string;
  note: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncStatus {
  lastSyncedAt: string | null;
  isPending: boolean;
  error: string | null;
  pendingChanges: number;
  connectedApps: string[];
}

// ─── Materials Integration ────────────────────────────────────────────────────

export interface MaterialsConfig {
  khanAcademy: { enabled: boolean; courseIds: string[] };
  openEdx: { enabled: boolean; courseIds: string[] };
  youtube: { enabled: boolean; playlistIds: string[] };
}
