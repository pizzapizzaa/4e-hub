// ─── Turso Client (Regional Edge DB) ─────────────────────────────────────────
// One logical Turso DB per district. The URL and auth token are injected
// via EAS secrets — never hardcoded or shipped in the app bundle.
//
// All Turso calls happen via your backend Edge Functions (Cloudflare Workers).
// The app never calls Turso directly — this module is for server-side use only.
// It is included here for shared type definitions used across the monorepo.

export interface TursoClientConfig {
  url: string;         // from EAS secret TURSO_URL
  authToken: string;   // from EAS secret TURSO_AUTH_TOKEN
}

// ─── Row-Level Security (enforced at middleware, not Turso itself) ─────────────
// Every query MUST include a school_id / tenant_id filter.
// Example pattern:
//
//   const rows = await turso.execute({
//     sql: 'SELECT * FROM students WHERE school_id = ? AND id = ?',
//     args: [schoolId, studentId],   // schoolId comes from validated JWT claim
//   });
//
// This prevents cross-tenant data leakage.

export interface TursoQueryOptions {
  schoolId: string;  // always required — enforced by middleware
  tenantId: string;  // district-level isolation
}

// ─── Schema Reference ─────────────────────────────────────────────────────────
// Kept here for documentation. Actual migrations run via Turso CLI or
// a migration tool (drizzle-orm with libsql adapter).
//
// CREATE TABLE schools (
//   id TEXT PRIMARY KEY,
//   district_id TEXT NOT NULL,
//   name TEXT NOT NULL,
//   address TEXT,
//   is_active INTEGER DEFAULT 1,
//   created_at TEXT NOT NULL
// );
//
// CREATE TABLE students (
//   id TEXT PRIMARY KEY,
//   user_id TEXT NOT NULL,
//   school_id TEXT NOT NULL,          -- RLS anchor
//   graduation_year INTEGER NOT NULL,
//   learning_path_id TEXT,
//   created_at TEXT NOT NULL
// );
//
// CREATE TABLE lesson_sessions (
//   id TEXT PRIMARY KEY,
//   student_id TEXT NOT NULL,
//   school_id TEXT NOT NULL,          -- RLS anchor
//   program_id TEXT NOT NULL,
//   subject TEXT NOT NULL,
//   lesson_id TEXT NOT NULL,
//   started_at TEXT NOT NULL,
//   completed_at TEXT,
//   score REAL
// );
//
// CREATE TABLE teacher_memoir (
//   id TEXT PRIMARY KEY,
//   teacher_id TEXT NOT NULL,
//   student_id TEXT NOT NULL,
//   school_id TEXT NOT NULL,          -- RLS anchor
//   class_id TEXT NOT NULL,
//   note TEXT NOT NULL,
//   tags TEXT NOT NULL,
//   is_private INTEGER DEFAULT 1,
//   created_at TEXT NOT NULL,
//   updated_at TEXT NOT NULL
// );
//
// CREATE TABLE audit_log (
//   id TEXT PRIMARY KEY,
//   actor_id TEXT NOT NULL,
//   action TEXT NOT NULL,
//   resource TEXT NOT NULL,
//   school_id TEXT NOT NULL,
//   ip_hash TEXT NOT NULL,
//   created_at TEXT NOT NULL
//   -- append-only: no UPDATE or DELETE allowed on this table
// );
