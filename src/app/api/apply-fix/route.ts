import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt, sanitizeJsonForPrompt } from '@/lib/security/prompt-sanitizer'
import { applyFixSchema } from '@/lib/validation/schemas'

type ExperienceEntry = {
  id: string
  title?: string
  company?: string
  period?: string
  description?: string
  bullets?: string[]
}

type ResumeData = {
  template?: string
  personal?: Record<string, unknown>
  experience?: ExperienceEntry[]
  dynamicSections?: unknown[]
}

type Improvement = {
  issue?: string
  weak_example?: string
  strong_example?: string
}

type ApplyFixPatch = {
  experienceId: string
  bulletIndex: number
  updatedBullet: string
  applied: boolean
}

function normalizeBullet(b: string): string {
  return b.trim().toLowerCase().replace(/\s+/g, ' ')
}

function isDuplicateOf(candidate: string, existing: string): boolean {
  const a = normalizeBullet(candidate)
  const b = normalizeBullet(existing)
  if (!a || !b) return false
  if (a === b) return true
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  return shorter.length > 20 && longer.includes(shorter)
}

const APPLY_FIX_SYSTEM = `You are an expert resume editor. Apply ONE specific improvement to the most relevant bullet point.

Rules:
- Find the bullet that best matches "Weak example" (fuzzy match acceptable, pick closest)
- Rewrite it guided by "Strong example" but adapted to the ACTUAL original context
- Keep the result under 20 words; start with a strong action verb
- NEVER invent metrics, numbers, or facts not present in the original bullet
- The updated bullet MUST be semantically distinct from ALL other bullets in the resume — do not copy or closely paraphrase any existing bullet
- If no genuine unique improvement can be made, return { "applied": false }

Return ONLY valid JSON, no markdown:
{
  "experienceId": "id of the experience entry",
  "bulletIndex": 0,
  "updatedBullet": "the improved bullet text",
  "applied": true
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  let userId: string | null = null
  try {
    const authResult = await auth()
    userId = authResult.userId
    const { sessionClaims } = authResult
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = applyFixSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    // SECURITY: sanitize each improvement field before it lands in the prompt.
    const safeImprovement = {
      issue: sanitizeForPrompt(body.improvement.issue, { maxChars: 1_000 }),
      weak_example: sanitizeForPrompt(body.improvement.weak_example, { maxChars: 1_500 }),
      strong_example: sanitizeForPrompt(body.improvement.strong_example, { maxChars: 1_500 }),
    }

    const plan = await getUserPlan(userId, emailHint)

    const supabase = createServerClient()

    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id, data, user_id')
      .eq('id', body.resumeId)
      .single()

    if (resumeError || !resume) {
      return jsonWithRequestId({ error: 'Resume not found' }, 404, requestId)
    }

    if (resume.user_id !== userId) {
      return jsonWithRequestId({ error: 'Forbidden' }, 403, requestId)
    }

    const resumeData = resume.data as ResumeData
    const experience = resumeData.experience || []

    if (experience.length === 0) {
      return jsonWithRequestId({ error: 'Resume has no experience bullets to fix', applied: false }, 422, requestId)
    }

    // Build a compact experience snapshot for the prompt (id + bullets only)
    // SECURITY: sanitize every string from the stored resume before it
    // lands in the prompt (users can embed instructions inside their own CV).
    const experienceForPrompt = experience.map((exp) => ({
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

    const imp = safeImprovement
    const prompt = `Resume experience (JSON):
${JSON.stringify(experienceForPrompt, null, 2)}

Improvement to apply:
- Issue: ${imp.issue || 'Improve this bullet'}
- Weak example (bullet to replace): ${imp.weak_example || ''}
- Strong example (guidance): ${imp.strong_example || ''}`

    const messages: MessageParam[] = [{ role: 'user', content: prompt }]

    const aiResponse = await callAnthropicWithLimits({
      userId,
      plan,
      feature: 'bullets',
      inputText: prompt,
      messages,
      system: APPLY_FIX_SYSTEM,
    })

    const responseText = extractTextFromAnthropicMessage(aiResponse)
    const patch = parseClaudeJsonText(responseText) as ApplyFixPatch

    if (!patch.applied || !patch.experienceId || patch.bulletIndex === undefined || !patch.updatedBullet?.trim()) {
      return jsonWithRequestId({ error: 'No matching bullet found to improve.', applied: false }, 422, requestId)
    }

    // Validate the target entry exists
    const targetEntry = experience.find((e) => e.id === patch.experienceId)
    if (!targetEntry) {
      return jsonWithRequestId({ error: 'AI referenced an invalid experience entry.', applied: false }, 422, requestId)
    }

    const targetBullets = Array.isArray(targetEntry.bullets) && targetEntry.bullets.length > 0
      ? targetEntry.bullets
      : [targetEntry.description || '']

    // Server-side duplicate check: updated bullet must not match any OTHER existing bullet
    const allOtherBullets = experience.flatMap((exp) => {
      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || '']
      return bullets.map((b, i) => ({ text: b, expId: exp.id, idx: i }))
    }).filter(({ expId, idx }) => !(expId === patch.experienceId && idx === patch.bulletIndex))

    const duplicateOf = allOtherBullets.find(({ text }) => isDuplicateOf(patch.updatedBullet, text))
    if (duplicateOf) {
      logger.warn('apply-fix: duplicate bullet detected, rejecting', {
        requestId, userId, resumeId: body.resumeId,
      })
      return jsonWithRequestId({
        error: 'AI generated a bullet that already exists in your resume. Please retry.',
        applied: false,
      }, 422, requestId)
    }

    // Record original before mutation
    const safeIndex = patch.bulletIndex >= 0 && patch.bulletIndex < targetBullets.length
      ? patch.bulletIndex
      : targetBullets.length - 1
    const originalBullet = targetBullets[safeIndex] || ''

    // Apply patch
    const updatedExperience = experience.map((exp) => {
      if (exp.id !== patch.experienceId) return exp
      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? [...exp.bullets]
        : [exp.description || '']
      bullets[safeIndex] = patch.updatedBullet
      const firstNonEmpty = bullets.find((b) => b.trim()) || bullets[0] || ''
      return { ...exp, bullets, description: firstNonEmpty }
    })

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ data: { ...resumeData, experience: updatedExperience } })
      .eq('id', body.resumeId)
      .eq('user_id', userId)

    if (updateError) {
      logger.error('apply-fix: save failed', { requestId, userId, error: updateError.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    if (body.reviewId) {
      void supabase.from('resume_analyses').insert({
        user_id: userId,
        resume_id: body.resumeId,
        review_id: body.reviewId,
        status: 'applied',
        applied_at: new Date().toISOString(),
      })
    }

    logger.info('apply-fix: bullet improved', {
      requestId, userId, resumeId: body.resumeId,
      experienceId: patch.experienceId, bulletIndex: safeIndex,
    })

    return jsonWithRequestId({
      applied: true,
      experienceId: patch.experienceId,
      bulletIndex: safeIndex,
      originalBullet,
      updatedBullet: patch.updatedBullet,
      experienceTitle: targetEntry.title || '',
      company: targetEntry.company || '',
    }, 200, requestId)
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      return jsonWithRequestId(error.payload, error.status, requestId)
    }
    if (error instanceof ClaudeJsonParseError) {
      return jsonWithRequestId({ error: 'AI response format invalid. Please retry.' }, 500, requestId)
    }
    logger.error('apply-fix route failed', {
      requestId, userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: 'Internal server error' }, 500, requestId)
  }
}
