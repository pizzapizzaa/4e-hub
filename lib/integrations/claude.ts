// ─── Claude Integration (Quiz Generation) ────────────────────────────────────
// All Claude API calls are proxied through YOUR backend.
// The Anthropic API key never leaves the server.
// Student input is sanitised before sending — PII is never included in prompts.

import { QuizQuestion, Subject } from '@/types';

export interface QuizGenerationRequest {
  subject: Subject;
  lessonTitle: string;
  lessonSummary: string;   // teacher-provided or auto-extracted, PII-free
  questionCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: 'en' | string;
}

export interface QuizGenerationResponse {
  questions: Omit<QuizQuestion, 'id' | 'sessionId'>[];
}

export async function generateQuiz(
  request: QuizGenerationRequest,
  accessToken: string,
): Promise<QuizGenerationResponse> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? '';

  const res = await fetch(`${baseUrl}/api/quiz/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Quiz generation failed: ${res.status} — ${err}`);
  }

  return res.json() as Promise<QuizGenerationResponse>;
}

// ─── Prompt Injection Guard (SEC-13) ────────────────────────────────────────────
// CLIENT-SIDE ONLY — this is a first-pass filter, not the security boundary.
// The backend MUST also validate and wrap user input in a delimited XML tag
// (e.g. <user_input>...</user_input>) so it cannot escape its prompt context.
// Do NOT rely on this list alone.

const INJECTION_PATTERNS = [
  /ignore (all |previous |prior )?instructions/i,
  /disregard (all|your) (previous|prior|above)/i,
  /you are now/i,
  /system prompt/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /act as (a |an )?/i,
  /pretend (you are|to be)/i,
  /forget (everything|all|your)/i,
  /override (your|all)/i,
  // Base64-encoded common injection starters
  /aWdub3Jl|c3lzdGVt|cHJldGVuZA==/i,
];

export function sanitiseUserInput(input: string): string {
  let sanitised = input.trim().slice(0, 2000); // hard cap
  for (const pattern of INJECTION_PATTERNS) {
    sanitised = sanitised.replace(pattern, '[removed]');
  }
  return sanitised;
}
