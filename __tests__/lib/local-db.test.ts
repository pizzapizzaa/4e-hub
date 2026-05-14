// ─── Local DB sync helpers — table allowlist (SEC-02) ─────────────────────────

// We test the allowlist guard without touching a real SQLite database.
// getUnsyncedRows / markSynced are tested indirectly by mocking expo-sqlite.

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() =>
    Promise.resolve({
      execAsync: jest.fn(() => Promise.resolve()),
      getAllAsync: jest.fn(() => Promise.resolve([])),
      runAsync: jest.fn(() => Promise.resolve()),
      closeAsync: jest.fn(() => Promise.resolve()),
    }),
  ),
}));

import { getUnsyncedRows, markSynced, openLocalDb } from '@/lib/db/local';

// Open the DB once so _db is populated
beforeAll(async () => {
  await openLocalDb('test-encryption-key');
});

describe('getUnsyncedRows — table allowlist', () => {
  it('accepts all valid sync table names', async () => {
    const tables = [
      'lesson_sessions',
      'quiz_questions',
      'quiz_attempts',
      'learning_trail',
      'teacher_memoir',
    ];
    for (const table of tables) {
      await expect(getUnsyncedRows(table)).resolves.toEqual([]);
    }
  });

  it('throws for disallowed table names', async () => {
    await expect(getUnsyncedRows('users')).rejects.toThrow('Disallowed table name');
    await expect(getUnsyncedRows('audit_log')).rejects.toThrow('Disallowed table name');
    await expect(getUnsyncedRows("'; DROP TABLE lesson_sessions; --")).rejects.toThrow(
      'Disallowed table name',
    );
  });
});

describe('markSynced — table allowlist', () => {
  it('accepts valid table names', async () => {
    await expect(markSynced('lesson_sessions', ['id-1'])).resolves.toBeUndefined();
  });

  it('throws for disallowed table names', async () => {
    await expect(markSynced('passwords', ['id-1'])).rejects.toThrow('Disallowed table name');
  });

  it('is a no-op when ids array is empty', async () => {
    await expect(markSynced('lesson_sessions', [])).resolves.toBeUndefined();
  });
});
