-- 4E Platform — Turso Schema
-- Run: turso db shell <db-name> < schema.sql
-- Safe to re-run: all statements use IF NOT EXISTS

-- ─── Users ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,             -- scrypt: salt:hash
  role            TEXT NOT NULL,             -- UserRole enum
  school_id       TEXT NOT NULL,
  district_id     TEXT NOT NULL,
  tenant_id       TEXT NOT NULL,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  avatar_url      TEXT,
  graduation_year INTEGER,                   -- students only
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_school   ON users (school_id);
CREATE INDEX IF NOT EXISTS idx_users_district ON users (district_id);

-- ─── Organisation ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id            TEXT PRIMARY KEY,
  district_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  address       TEXT,
  admin_ids     TEXT NOT NULL DEFAULT '[]',      -- JSON array
  teacher_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schools_district ON schools (district_id);

-- ─── People ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS students (
  id               TEXT PRIMARY KEY,
  user_id          TEXT NOT NULL,
  school_id        TEXT NOT NULL,                   -- RLS anchor
  graduation_year  INTEGER NOT NULL,
  learning_path_id TEXT,
  guardian_ids     TEXT NOT NULL DEFAULT '[]',      -- JSON array
  created_at       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students (school_id);

CREATE TABLE IF NOT EXISTS teachers (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  school_id      TEXT NOT NULL,                     -- RLS anchor
  class_ids      TEXT NOT NULL DEFAULT '[]',        -- JSON array
  subject_areas  TEXT NOT NULL DEFAULT '[]',        -- JSON array
  qualifications TEXT,
  created_at     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teachers_school ON teachers (school_id);

-- ─── Curriculum ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS programs (
  id               TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  subject          TEXT NOT NULL,
  level            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  material_sources TEXT NOT NULL DEFAULT '[]',      -- JSON array
  teaching_method  TEXT NOT NULL,
  is_active        INTEGER DEFAULT 1,
  school_ids       TEXT NOT NULL DEFAULT '[]',      -- JSON array
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lessons (
  id                 TEXT PRIMARY KEY,
  program_id         TEXT NOT NULL,
  title              TEXT NOT NULL,
  subject            TEXT NOT NULL,
  lesson_order       INTEGER NOT NULL,
  video_url          TEXT,
  khan_activity_id   TEXT,
  open_edx_course_id TEXT,
  duration_minutes   INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (program_id) REFERENCES programs (id)
);

CREATE INDEX IF NOT EXISTS idx_lessons_program ON lessons (program_id);

CREATE TABLE IF NOT EXISTS classes (
  id            TEXT PRIMARY KEY,
  school_id     TEXT NOT NULL,                     -- RLS anchor
  teacher_id    TEXT NOT NULL,
  name          TEXT NOT NULL,
  subject       TEXT NOT NULL,
  student_ids   TEXT NOT NULL DEFAULT '[]',        -- JSON array
  program_id    TEXT NOT NULL,
  academic_year TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_classes_school  ON classes (school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes (teacher_id);

-- ─── Learning Activity ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_sessions (
  id              TEXT PRIMARY KEY,
  student_id      TEXT NOT NULL,
  school_id       TEXT NOT NULL,                   -- RLS anchor
  program_id      TEXT NOT NULL,
  subject         TEXT NOT NULL,
  lesson_id       TEXT NOT NULL,
  quiz_session_id TEXT,
  started_at      TEXT NOT NULL,
  completed_at    TEXT,
  score           REAL
);

CREATE INDEX IF NOT EXISTS idx_lesson_sessions_school  ON lesson_sessions (school_id);
CREATE INDEX IF NOT EXISTS idx_lesson_sessions_student ON lesson_sessions (student_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             TEXT PRIMARY KEY,
  question_id    TEXT NOT NULL,
  session_id     TEXT NOT NULL,
  student_id     TEXT NOT NULL,
  school_id      TEXT NOT NULL,                    -- RLS anchor
  selected_index INTEGER NOT NULL,
  is_correct     INTEGER NOT NULL,
  attempted_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_school  ON quiz_attempts (school_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_student ON quiz_attempts (student_id);

CREATE TABLE IF NOT EXISTS learning_trail (
  id               TEXT PRIMARY KEY,
  student_id       TEXT NOT NULL,
  school_id        TEXT NOT NULL,                  -- RLS anchor
  subject          TEXT NOT NULL,
  lesson_id        TEXT NOT NULL,
  lesson_title     TEXT NOT NULL,
  completed_at     TEXT NOT NULL,
  score            REAL,
  duration_minutes INTEGER
);

CREATE INDEX IF NOT EXISTS idx_learning_trail_school  ON learning_trail (school_id);
CREATE INDEX IF NOT EXISTS idx_learning_trail_student ON learning_trail (student_id);

-- ─── Teaching Tools ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS teacher_memoir (
  id         TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  school_id  TEXT NOT NULL,                        -- RLS anchor
  class_id   TEXT NOT NULL,
  note       TEXT NOT NULL,
  tags       TEXT NOT NULL DEFAULT '[]',           -- JSON array
  is_private INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_teacher_memoir_school  ON teacher_memoir (school_id);
CREATE INDEX IF NOT EXISTS idx_teacher_memoir_teacher ON teacher_memoir (teacher_id);

CREATE TABLE IF NOT EXISTS broadcast_sessions (
  id                 TEXT PRIMARY KEY,
  teacher_id         TEXT NOT NULL,
  school_id          TEXT NOT NULL,                -- RLS anchor
  class_id           TEXT NOT NULL,
  video_url          TEXT NOT NULL,
  is_live            INTEGER DEFAULT 0,
  liveblocks_room_id TEXT NOT NULL,
  started_at         TEXT NOT NULL,
  ended_at           TEXT
);

CREATE INDEX IF NOT EXISTS idx_broadcast_school  ON broadcast_sessions (school_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_teacher ON broadcast_sessions (teacher_id);

-- ─── Audit (append-only) ──────────────────────────────────────────────────────
-- Do NOT grant UPDATE or DELETE permissions on this table.

CREATE TABLE IF NOT EXISTS audit_log (
  id         TEXT PRIMARY KEY,
  actor_id   TEXT NOT NULL,
  action     TEXT NOT NULL,
  resource   TEXT NOT NULL,
  school_id  TEXT NOT NULL,
  ip_hash    TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_school ON audit_log (school_id);

-- ─── Auth (refresh token store) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,   -- SHA-256 hex of the plaintext token
  expires_at TEXT NOT NULL,          -- ISO 8601
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);
