import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import {
  checkFeatureLimit,
  checkAndReserveTokens,
  getPlanLimits,
  getRateLimitStatus,
  getMonthlyResetAtIso,
  incrementFeatureCounterBy,
  recordLimitHit,
} from '@/lib/ratelimit'
import { ClaudeJsonParseError, parseClaudeJsonText } from '@/lib/claude-json'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'

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

type RawPatch = {
  experienceId: string
  bulletIndex: number
  updatedBullet: string
}

export type FixPatchWithContext = {
  experienceId: string
  bulletIndex: number
  originalBullet: string
  updatedBullet: string
  experienceTitle?: string
  company?: string
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

const AUTO_FIX_SYSTEM = `You are an expert resume editor. Apply ALL improvement suggestions to the resume.

Rules:
- For each improvement, find the bullet that best matches the "Weak example" and improve it
- Guided by "Strong example" but adapted to the ACTUAL original text — do not copy verbatim
- Keep bullets under 20 words; start with a strong action verb
- NEVER invent metrics, numbers, or facts not present in the original bullet
- Every updated bullet MUST be completely unique — do not duplicate or closely paraphrase any other existing bullet in the resume
- Each bullet position should be patched at most once
- If a genuine unique improvement cannot be made for a given suggestion, skip it

Return ONLY valid JSON, no markdown:
{
  "patches": [
    {
      "experienceId": "id of experience entry",
      "bulletIndex": 0,
      "updatedBullet": "improved text"
    }
  ],
  "fixesApplied": 2
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  let userId: string | null = null
  try {
    const url = new URL(req.url)
    const dryRun = url.searchParams.get('dryRun') === 'true'

    const authResult = await auth()
    userId = authResult.userId
    const { sessionClaims } = authResult
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)

    const body = (await req.json()) as {
      resumeId?: string
      reviewId?: string
      improvements?: Improvement[]
    }

    if (!body.resumeId || !Array.isArray(body.improvements) || body.improvements.length === 0) {
      return jsonWithRequestId({ error: 'resumeId and improvements[] are required' }, 400, requestId)
    }

    const plan = await getUserPlan(userId, emailHint)
    const featureCheck = await checkFeatureLimit(userId, 'bullets', plan)

    if (!featureCheck.allowed) {
      if (!dryRun) {
        await recordLimitHit(userId, 'bullets')
      }

      if (featureCheck.blocked) {
        return jsonWithRequestId(
          {
            error: 'Access to this feature has been temporarily suspended. Please contact support.',
            limitType: 'blocked',
            feature: 'bullets',
            resetAt: getMonthlyResetAtIso(),
          },
          429,
          requestId
        )
      }

      return jsonWithRequestId(
        {
          error: `You have used all ${featureCheck.limit || 0} bullet rewrites available this month.`,
          limitType: 'feature',
          feature: 'bullets',
          used: featureCheck.used,
          limit: featureCheck.limit ?? undefined,
          resetAt: getMonthlyResetAtIso(),
        },
        429,
        requestId
      )
    }

    const remainingBulletCredits = featureCheck.limit === null
      ? null
      : Math.max((featureCheck.limit || 0) - featureCheck.used, 0)

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
      return jsonWithRequestId({ error: 'Resume has no experience to fix', fixesApplied: 0, patches: [] }, 422, requestId)
    }

    const experienceForPrompt = experience.map((exp) => ({
      id: exp.id,
      title: exp.title || '',
      company: exp.company || '',
      bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || ''],
    }))

    const improvementsText = body.improvements
      .map((imp, i) =>
        `${i + 1}. Issue: ${imp.issue || 'Improve'}\n   Weak: ${imp.weak_example || ''}\n   Strong (guidance): ${imp.strong_example || ''}`
      )
      .join('\n\n')

    const prompt = `Resume experience (JSON):
${JSON.stringify(experienceForPrompt, null, 2)}

Improvements to apply:
${improvementsText}`

    const limits = getPlanLimits(plan)
    const inputLength = prompt.length
    const estimatedInputTokens = Math.ceil(inputLength / 4)

    if (inputLength > limits.maxRawChars || estimatedInputTokens > limits.maxInputTokensPerCall) {
      return jsonWithRequestId(
        {
          allowed: false,
          error: 'The document is too long. Maximum 32,000 characters (~8 A4 pages).',
          limitType: 'input_too_long',
          estimatedInputTokens,
          resetAt: getMonthlyResetAtIso(),
        },
        429,
        requestId
      )
    }

    const tokenReserve = await checkAndReserveTokens(userId, plan, estimatedInputTokens)
    if (!tokenReserve.allowed) {
      const limitType = tokenReserve.limitType || 'tokens'

      if (!dryRun) {
        await recordLimitHit(userId, limitType)
      }

      if (limitType === 'hard_cap') {
        return jsonWithRequestId(
          {
            allowed: false,
            error: 'The absolute monthly limit has been reached. Please contact support.',
            limitType,
            estimatedInputTokens,
            resetAt: getMonthlyResetAtIso(),
          },
          429,
          requestId
        )
      }

      const resetAt = getMonthlyResetAtIso()
      const monthLabel = new Date(resetAt).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
      return jsonWithRequestId(
        {
          allowed: false,
          error: `You have reached your monthly AI limit. Upgrade your plan or wait for the reset on ${monthLabel} 1st.`,
          limitType,
          estimatedInputTokens,
          resetAt,
        },
        429,
        requestId
      )
    }

    const rateLimitStatus = await getRateLimitStatus(userId, plan)
    const tokenRemaining = rateLimitStatus.tokens.remaining

    if (tokenRemaining !== null && tokenRemaining <= 0) {
      const resetAt = getMonthlyResetAtIso()
      const monthLabel = new Date(resetAt).toLocaleString('en-US', { month: 'long', timeZone: 'UTC' })
      return jsonWithRequestId(
        {
          allowed: false,
          error: `You have reached your monthly AI limit. Upgrade your plan or wait for the reset on ${monthLabel} 1st.`,
          limitType: 'tokens',
          estimatedInputTokens,
          remainingTokens: tokenRemaining,
          resetAt,
        },
        429,
        requestId
      )
    }

    if (dryRun) {
      return jsonWithRequestId(
        {
          allowed: true,
          estimatedInputTokens,
          remainingTokens: tokenRemaining,
          resetAt: getMonthlyResetAtIso(),
        },
        200,
        requestId
      )
    }

    const messages: MessageParam[] = [{ role: 'user', content: prompt }]

    const aiResponse = await callAnthropicWithLimits({
      userId,
      plan,
      inputText: prompt,
      messages,
      system: AUTO_FIX_SYSTEM,
    })

    const responseText = extractTextFromAnthropicMessage(aiResponse)
    const result = parseClaudeJsonText(responseText) as { patches?: RawPatch[]; fixesApplied?: number }
    const rawPatches: RawPatch[] = Array.isArray(result?.patches) ? result.patches : []

    if (rawPatches.length === 0) {
      return jsonWithRequestId({ fixesApplied: 0, patches: [] }, 200, requestId)
    }

    // Build a flat list of all existing bullets for duplicate checking
    const allExistingBullets = experience.flatMap((exp) => {
      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || '']
      return bullets.map((b, i) => ({ text: b, expId: exp.id, idx: i }))
    })

    // Validate + deduplicate patches
    const patchMap = new Map<string, Map<number, string>>() // expId → (bulletIdx → updatedText)
    const usedBulletTexts = new Set<string>() // track updated texts within this batch to prevent intra-batch dupes

    for (const raw of rawPatches) {
      if (!raw.experienceId || raw.bulletIndex === undefined || !raw.updatedBullet?.trim()) continue

      const targetEntry = experience.find((e) => e.id === raw.experienceId)
      if (!targetEntry) continue

      const targetBullets = Array.isArray(targetEntry.bullets) && targetEntry.bullets.length > 0
        ? targetEntry.bullets
        : [targetEntry.description || '']

      const safeIdx = raw.bulletIndex >= 0 && raw.bulletIndex < targetBullets.length
        ? raw.bulletIndex
        : targetBullets.length - 1

      // Skip if this position was already patched
      if (patchMap.get(raw.experienceId)?.has(safeIdx)) continue

      const updatedText = raw.updatedBullet.trim()

      // Duplicate check against all OTHER existing bullets (not the one being replaced)
      const otherBullets = allExistingBullets.filter(
        ({ expId, idx }) => !(expId === raw.experienceId && idx === safeIdx)
      )
      const isExistingDuplicate = otherBullets.some(({ text }) => isDuplicateOf(updatedText, text))
      if (isExistingDuplicate) {
        logger.warn('auto-fix: skipping duplicate patch', { requestId, userId, experienceId: raw.experienceId })
        continue
      }

      // Intra-batch duplicate check
      const normalised = normalizeBullet(updatedText)
      if (usedBulletTexts.has(normalised)) continue
      usedBulletTexts.add(normalised)

      if (!patchMap.has(raw.experienceId)) patchMap.set(raw.experienceId, new Map())
      patchMap.get(raw.experienceId)!.set(safeIdx, updatedText)
    }

    // Build enriched patches (with original + context) and apply to resume.
    const candidatePatches: FixPatchWithContext[] = []

    for (const exp of experience) {
      const bulletPatches = patchMap.get(exp.id)
      if (!bulletPatches) continue

      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || '']

      const sortedIndexes = Array.from(bulletPatches.keys()).sort((a, b) => a - b)
      for (const idx of sortedIndexes) {
        const text = bulletPatches.get(idx)
        if (!text) continue
        candidatePatches.push({
          experienceId: exp.id,
          bulletIndex: idx,
          originalBullet: bullets[idx] || '',
          updatedBullet: text,
          experienceTitle: exp.title || '',
          company: exp.company || '',
        })
      }
    }

    const maxAllowed = remainingBulletCredits === null
      ? candidatePatches.length
      : Math.min(candidatePatches.length, remainingBulletCredits)
    const enrichedPatches = candidatePatches.slice(0, maxAllowed)

    const allowedPatchMap = new Map<string, Map<number, string>>()
    for (const patch of enrichedPatches) {
      if (!allowedPatchMap.has(patch.experienceId)) {
        allowedPatchMap.set(patch.experienceId, new Map())
      }
      allowedPatchMap.get(patch.experienceId)!.set(patch.bulletIndex, patch.updatedBullet)
    }

    const updatedExperience = experience.map((exp) => {
      const bulletPatches = allowedPatchMap.get(exp.id)
      if (!bulletPatches) return exp

      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? [...exp.bullets]
        : [exp.description || '']

      for (const [idx, text] of bulletPatches) {
        bullets[idx] = text
      }

      const firstNonEmpty = bullets.find((b) => b.trim()) || bullets[0] || ''
      return { ...exp, bullets, description: firstNonEmpty }
    })

    const appliedCount = enrichedPatches.length

    if (appliedCount === 0) {
      return jsonWithRequestId({ fixesApplied: 0, patches: [] }, 200, requestId)
    }

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ data: { ...resumeData, experience: updatedExperience } })
      .eq('id', body.resumeId)
      .eq('user_id', userId)

    if (updateError) {
      logger.error('auto-fix: save failed', { requestId, userId, error: updateError.message })
      return jsonWithRequestId({ error: updateError.message }, 500, requestId)
    }

    if (body.reviewId) {
      void supabase.from('resume_analyses').insert({
        user_id: userId,
        resume_id: body.resumeId,
        review_id: body.reviewId,
        status: 'applied',
        applied_at: new Date().toISOString(),
        analysis_json: { fixesApplied: appliedCount },
      })
    }

    await incrementFeatureCounterBy(userId, 'bullets', appliedCount)

    logger.info('auto-fix: improvements applied', {
      requestId, userId, resumeId: body.resumeId, appliedCount,
    })

    return jsonWithRequestId({ fixesApplied: appliedCount, patches: enrichedPatches }, 200, requestId)
  } catch (error) {
    if (isRateLimitExceededError(error)) {
      return jsonWithRequestId(error.payload, error.status, requestId)
    }
    if (error instanceof ClaudeJsonParseError) {
      return jsonWithRequestId({ error: 'AI response format invalid. Please retry.' }, 500, requestId)
    }
    logger.error('auto-fix route failed', {
      requestId, userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: 'Internal server error' }, 500, requestId)
  }
}
