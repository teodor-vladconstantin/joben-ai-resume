// Shared logic between /api/apply-fix (apply ONE improvement) and
// /api/auto-fix (apply MANY improvements in one call). These two routes were
// near-identical clones for their auth/ownership/prompt-building preamble and
// their duplicate-bullet guard, so that shared slice lives here.
//
// Deliberately NOT extracted (left inline in each route — see route-level
// comments): rate-limiting/quota/plan-gating checks (auto-fix has an extra
// feature-limit + token-reserve gate that apply-fix does not have), the
// callAnthropicWithLimits call itself (apply-fix passes `feature: 'bullets'`,
// auto-fix does not — it gates manually instead), the AI system prompts, and
// the single- vs multi-patch application/looping logic.

import { auth } from '@clerk/nextjs/server'
import type { NextResponse } from 'next/server'
import { z } from 'zod'
import { isRateLimitExceededError } from '@/lib/anthropic-with-limits'
import { ClaudeJsonParseError } from '@/lib/claude-json'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims } from '@/lib/plans'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt, sanitizeJsonForPrompt } from '@/lib/security/prompt-sanitizer'
import type { createServerClient } from '@/lib/supabase/server'

export type ExperienceEntry = {
  id: string
  title?: string
  company?: string
  period?: string
  description?: string
  bullets?: string[]
}

export type ResumeData = {
  template?: string
  personal?: Record<string, unknown>
  experience?: ExperienceEntry[]
  dynamicSections?: unknown[]
}

// --- Duplicate-bullet validation ---
// Extracted verbatim from both routes. Do NOT tweak thresholds/behavior here
// without checking both apply-fix and auto-fix — they share this exact guard.

export function normalizeBullet(b: string): string {
  return b.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isDuplicateOf(candidate: string, existing: string): boolean {
  const a = normalizeBullet(candidate)
  const b = normalizeBullet(existing)
  if (!a || !b) return false
  if (a === b) return true
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  return shorter.length > 20 && longer.includes(shorter)
}

// --- Auth preamble (identical in both routes) ---

export async function requireFixRouteAuth(
  requestId: string
): Promise<
  | { ok: true; userId: string; emailHint: string | undefined }
  | { ok: false; response: NextResponse }
> {
  const authResult = await auth()
  const { userId, sessionClaims } = authResult
  if (!userId) {
    return { ok: false, response: jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId) }
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)
  return { ok: true, userId, emailHint }
}

// --- JSON body parse + Zod validation (identical shape, schema differs) ---

export async function parseFixRequestBody<T>(
  req: Request,
  schema: z.ZodType<T>,
  requestId: string
): Promise<{ ok: true; body: T } | { ok: false; response: NextResponse }> {
  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return { ok: false, response: jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId) }
  }

  const parsed = schema.safeParse(rawBody)
  if (!parsed.success) {
    return { ok: false, response: jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId) }
  }

  return { ok: true, body: parsed.data }
}

// --- Resume fetch + ownership check (identical in both routes) ---

export type OwnedFixResumeRow = { id: string; data: ResumeData; user_id: string }

export async function fetchOwnedResumeForFix(
  supabase: ReturnType<typeof createServerClient>,
  resumeId: string,
  userId: string,
  requestId: string
): Promise<{ ok: true; resume: OwnedFixResumeRow } | { ok: false; response: NextResponse }> {
  const { data: resume, error: resumeError } = await supabase
    .from('resumes')
    .select('id, data, user_id')
    .eq('id', resumeId)
    .single()

  if (resumeError || !resume) {
    return { ok: false, response: jsonWithRequestId({ error: 'Resume not found' }, 404, requestId) }
  }

  if (resume.user_id !== userId) {
    return { ok: false, response: jsonWithRequestId({ error: 'Forbidden' }, 403, requestId) }
  }

  return { ok: true, resume: resume as OwnedFixResumeRow }
}

// --- Prompt-safe experience snapshot (identical mapping in both routes) ---
// SECURITY: sanitizes every string pulled from the stored resume before it
// lands in the AI prompt (users can embed instructions inside their own CV).

export function buildExperienceForPrompt(experience: ExperienceEntry[]) {
  return experience.map((exp) => ({
    id: exp.id,
    title: sanitizeForPrompt(exp.title || '', { maxChars: 200 }),
    company: sanitizeForPrompt(exp.company || '', { maxChars: 200 }),
    bullets: sanitizeJsonForPrompt(
      Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || ''],
      { maxChars: 1_500 }
    ),
  }))
}

// --- Shared catch-all error handling (identical modulo route label) ---

export async function handleFixRouteError(
  error: unknown,
  ctx: { requestId: string; userId: string | null; route: string; routeLogLabel: string }
): Promise<NextResponse> {
  const { requestId, userId, route, routeLogLabel } = ctx

  if (isRateLimitExceededError(error)) {
    if (error.status === 429 && userId) {
      await sendRateLimitEmailIfEligible({
        userId,
        requestId,
        route,
        reason: error.payload?.limitType || 'rate_limit',
      })
    }
    return jsonWithRequestId(error.payload, error.status, requestId)
  }

  if (error instanceof ClaudeJsonParseError) {
    return jsonWithRequestId({ error: 'AI response format invalid. Please retry.' }, 500, requestId)
  }

  logger.error(routeLogLabel, {
    requestId,
    userId,
    error: error instanceof Error ? error.message : 'Unknown error',
  })
  return jsonWithRequestId({ error: 'Internal server error' }, 500, requestId)
}
