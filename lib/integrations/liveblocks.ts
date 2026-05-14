// ─── Liveblocks Integration (Real-time Cursors & Broadcast) ──────────────────
// Rooms are scoped to classId + sessionId. Tokens are short-lived and
// generated server-side — the app never holds the Liveblocks secret key.

export interface LiveblocksRoomOptions {
  classId: string;
  sessionId: string;
  userId: string;
  role: 'teacher' | 'student';
}

export function buildRoomId(classId: string, sessionId: string): string {
  // Format: e4hub_{classId}_{sessionId}
  // Segmented so room access can be validated server-side before issuing token.
  return `e4hub_${classId}_${sessionId}`;
}

export interface LiveblocksTokenRequest {
  roomId: string;
  userId: string;
  userInfo: {
    name: string;
    role: string;
    schoolId: string; // for server-side validation
  };
}

// Token is fetched from YOUR backend — never the Liveblocks secret directly.
// accessToken is REQUIRED so the endpoint can verify the caller's identity (SEC-01).
export async function fetchRoomToken(
  request: LiveblocksTokenRequest,
  accessToken: string,
): Promise<string> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  const res = await fetch(`${baseUrl}/api/liveblocks/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    throw new Error(`Failed to get Liveblocks token: ${res.status}`);
  }

  const data = await res.json() as { token: string };
  return data.token;
}

// ─── Cursor / Presence Types ──────────────────────────────────────────────────

export interface CursorPresence {
  cursor: { x: number; y: number } | null;
  userId: string;
  name: string;
  role: 'teacher' | 'student';
}

export interface BroadcastPayload {
  type: 'VIDEO_PLAY' | 'VIDEO_PAUSE' | 'VIDEO_SEEK' | 'SCREEN_SHARE';
  videoUrl?: string;
  seekPosition?: number;
  timestamp: number;
}
