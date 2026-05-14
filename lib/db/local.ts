// ─── Local SQLite DB (expo-sqlite + SQLCipher encryption) ────────────────────
// Encryption key must be derived from the user's authenticated session.
// Never hardcode the key — retrieve it from secure storage after login.

import * as SQLite from 'expo-sqlite';

// ─── Table allowlist — prevents SQL injection via table-name interpolation (SEC-02) ──
const ALLOWED_SYNC_TABLES = new Set([
  'lesson_sessions',
  'quiz_questions',
  'quiz_attempts',
  'learning_trail',
  'teacher_memoir',
] as const);

function assertSyncTable(table: string): void {
  if (!ALLOWED_SYNC_TABLES.has(table as never)) {
    throw new Error(`Disallowed table name for sync operation: "${table}"`);
  }
}

let _db: SQLite.SQLiteDatabase | null = null;

export async function openLocalDb(encryptionKey: string): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;

  // SQLCipher pragma is set via the encryption key option
  _db = await SQLite.openDatabaseAsync(
    'e4hub_local.db',
    // QA-04: typed via assertion; expo-sqlite/next exposes encryptionKey but doesn't ship
    // the option in its public typings yet. Cast is safe — the runtime accepts this shape.
    { encryptionKey } as Parameters<typeof SQLite.openDatabaseAsync>[1] & { encryptionKey: string },
  );

  await initSchema(_db);
  return _db;
}

export function getLocalDb(): SQLite.SQLiteDatabase {
  if (!_db) throw new Error('Local DB not initialised. Call openLocalDb() after login.');
  return _db;
}

export async function closeLocalDb(): Promise<void> {
  if (_db) {
    await _db.closeAsync();
    _db = null;
  }
}

// ─── Schema ───────────────────────────────────────────────────────────────────

async function initSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS lesson_sessions (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      program_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      score REAL,
      quiz_session_id TEXT,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL,  -- JSON array
      correct_index INTEGER NOT NULL,
      subject TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      difficulty TEXT NOT NULL DEFAULT 'medium'
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      selected_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL,
      attempted_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS learning_trail (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      subject TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      lesson_title TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      score REAL,
      duration_minutes INTEGER,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS teacher_memoir (
      id TEXT PRIMARY KEY,
      teacher_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      school_id TEXT NOT NULL,
      class_id TEXT NOT NULL,
      note TEXT NOT NULL,
      tags TEXT NOT NULL,  -- JSON array
      is_private INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_student ON lesson_sessions(student_id);
    CREATE INDEX IF NOT EXISTS idx_trail_student ON learning_trail(student_id);
    CREATE INDEX IF NOT EXISTS idx_memoir_teacher ON teacher_memoir(teacher_id);
    CREATE INDEX IF NOT EXISTS idx_memoir_student ON teacher_memoir(student_id);
  `);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export async function getUnsyncedRows(
  table: string,
  limit = 100,
): Promise<Record<string, unknown>[]> {
  assertSyncTable(table);
  const db = getLocalDb();
  return db.getAllAsync(`SELECT * FROM ${table} WHERE synced = 0 LIMIT ?`, [limit]);
}

export async function markSynced(table: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  assertSyncTable(table);
  const db = getLocalDb();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`, ids);
}
