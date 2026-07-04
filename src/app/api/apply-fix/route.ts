import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getUserPlan } from '@/lib/plans'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt } from '@/lib/security/prompt-sanitizer'
import { applyFixSchema } from '@/lib/validation/schemas'
import {
  buildExperienceForPrompt,
  fetchOwnedResumeForFix,
  handleFixRouteError,
  isDuplicateOf,
  parseFixRequestBody,
  requireFixRouteAuth,
} from '@/lib/fix-improvements'
import type { ResumeData } from '@/lib/fix-improvements'

type ApplyFixPatch = {
  experienceId: string
  bulletIndex: number
  updatedBullet: string
  applied: boolean
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
    const authResult = await requireFixRouteAuth(requestId)
    if (!authResult.ok) return authResult.response
    userId = authResult.userId
    const emailHint = authResult.emailHint

    const parsedBody = await parseFixRequestBody(req, applyFixSchema, requestId)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    // SECURITY: sanitize each improvement field before it lands in the prompt.
    const safeImprovement = {
      issue: sanitizeForPrompt(body.improvement.issue, { maxChars: 1_000 }),
      weak_example: sanitizeForPrompt(body.improvement.weak_example, { maxChars: 1_500 }),
      strong_example: sanitizeForPrompt(body.improvement.strong_example, { maxChars: 1_500 }),
    }

    const plan = await getUserPlan(userId, emailHint)

    const supabase = createServerClient()

    const ownedResume = await fetchOwnedResumeForFix(supabase, body.resumeId, userId, requestId)
    if (!ownedResume.ok) return ownedResume.response
    const resume = ownedResume.resume

    const resumeData = resume.data as ResumeData
    const experience = resumeData.experience || []

    if (experience.length === 0) {
      return jsonWithRequestId({ error: 'Resume has no experience bullets to fix', applied: false }, 422, requestId)
    }

    // Build a compact experience snapshot for the prompt (id + bullets only)
    const experienceForPrompt = buildExperienceForPrompt(experience)

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
    return handleFixRouteError(error, {
      requestId,
      userId,
      route: '/api/apply-fix',
      routeLogLabel: 'apply-fix route failed',
    })
  }
}
