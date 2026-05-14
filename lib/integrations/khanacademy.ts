// ─── Khan Academy LTI Integration ────────────────────────────────────────────
// LTI OAuth tokens are stored server-side only — never in the app.
// The app fetches activity URLs from your backend, which signs the LTI launch.

export interface KhanActivityLaunchRequest {
  courseId: string;
  activityId: string;
  studentId: string;   // used server-side for LTI user_id claim
}

export interface KhanActivityLaunchResponse {
  launchUrl: string;   // signed LTI launch URL, valid for 5 minutes
  expiresAt: number;
}

export async function getLaunchUrl(
  request: KhanActivityLaunchRequest,
  accessToken: string,
): Promise<KhanActivityLaunchResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  const res = await fetch(`${baseUrl}/api/integrations/khan/launch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) throw new Error(`Khan Academy launch failed: ${res.status}`);
  return res.json() as Promise<KhanActivityLaunchResponse>;
}
