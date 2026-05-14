// ─── PowerSync Configuration ─────────────────────────────────────────────────
// Handles offline-first sync between local SQLite and Turso (regional DB).
// Sync rules enforce tenant isolation — each user only pulls their school's data.
//
// Install: npx expo install @powersync/react-native

import { getSession } from '@/lib/auth/session';

export interface SyncConfig {
  powersyncUrl: string;
  getToken: () => Promise<string>;
  onSyncComplete?: () => void;
  onSyncError?: (error: Error) => void;
}

export function buildSyncConfig(): SyncConfig {
  const powersyncUrl = process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '';

  return {
    powersyncUrl,
    getToken: async () => {
      const session = getSession();
      if (!session) throw new Error('No active session for sync token.');
      // Token is scoped with school_id + tenant_id claims
      // PowerSync uses this to enforce bucket-level isolation
      return session.accessToken;
    },
  };
}

// ─── Sync Rule Reference ─────────────────────────────────────────────────────
// These are enforced server-side in PowerSync dashboard, shown here for reference.
//
// bucket_definition: student_data
//   parameters: SELECT token_parameters.school_id AS school_id
//   data:
//     - SELECT * FROM lesson_sessions WHERE school_id = bucket.school_id
//     - SELECT * FROM quiz_attempts WHERE school_id = bucket.school_id
//     - SELECT * FROM learning_trail WHERE school_id = bucket.school_id
//
// bucket_definition: teacher_data
//   parameters: SELECT token_parameters.teacher_id AS teacher_id
//   data:
//     - SELECT * FROM teacher_memoir WHERE teacher_id = bucket.teacher_id
//     - SELECT * FROM broadcast_sessions WHERE teacher_id = bucket.teacher_id

// ─── Sync Status Helpers ──────────────────────────────────────────────────────

export interface SyncState {
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  pendingUpload: number;
  error: string | null;
}

let _syncState: SyncState = {
  isSyncing: false,
  lastSyncedAt: null,
  pendingUpload: 0,
  error: null,
};

export function getSyncState(): SyncState {
  return { ..._syncState };
}

export function updateSyncState(patch: Partial<SyncState>): void {
  _syncState = { ..._syncState, ...patch };
}
