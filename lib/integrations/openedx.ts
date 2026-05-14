// ─── Open edX API Integration ─────────────────────────────────────────────────
// API calls are proxied through your backend — edX credentials never in the app.

export interface OpenEdxCourse {
  id: string;
  name: string;
  shortDescription: string;
  courseImageUrl: string;
  startDate: string;
}

export interface OpenEdxEnrollment {
  courseId: string;
  userId: string;
  isActive: boolean;
  enrolledAt: string;
}

export async function getCourseList(
  accessToken: string,
  subject?: string,
): Promise<OpenEdxCourse[]> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
  const params = subject ? `?subject=${encodeURIComponent(subject)}` : '';

  const res = await fetch(`${baseUrl}/api/integrations/openedx/courses${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) throw new Error(`OpenEdX courses fetch failed: ${res.status}`);
  return res.json() as Promise<OpenEdxCourse[]>;
}

export async function enrollStudent(
  courseId: string,
  studentId: string,
  accessToken: string,
): Promise<OpenEdxEnrollment> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  const res = await fetch(`${baseUrl}/api/integrations/openedx/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ courseId, studentId }),
  });

  if (!res.ok) throw new Error(`OpenEdX enroll failed: ${res.status}`);
  return res.json() as Promise<OpenEdxEnrollment>;
}
