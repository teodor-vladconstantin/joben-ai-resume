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

const APPLY_FIX_SYSTEM = `You are an expert resume editor. Apply ONE improvement to the most relevant bullet point.

Rules:
- Find the bullet that best matches "weak_example" (fuzzy OK, pick closest)
- Rewrite it guided by "strong_example" but adapted to the original context
- Keep bullet under 20 words; start with an action verb
- NEVER invent metrics or numbers not present/implied in the original bullet
- Return ONLY valid JSON, no markdown, no preamble

Schema:
{
  "experienceId": "id of the experience entry",
  "bulletIndex": 0,
  "updatedBullet": "improved text",
  "applied": true
}

If no relevant bullet exists, return: { "applied": false, "experienceId": "", "bulletIndex": 0, "updatedBullet": "" }`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)

  const body = (await req.json()) as {
    resumeId?: string
    reviewId?: string
    improvement?: Improvement
  }

  if (!body.resumeId || !body.improvement) {
    return jsonWithRequestId({ error: 'resumeId and improvement are required' }, 400, requestId)
  }

  const plan = await getUserPlan(userId, emailHint)

  try {
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

    const experienceForPrompt = experience.map((exp) => ({
      id: exp.id,
      title: exp.title || '',
      company: exp.company || '',
      bullets: Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? exp.bullets
        : [exp.description || ''],
    }))

    const imp = body.improvement
    const prompt = `Resume experience (JSON):
${JSON.stringify(experienceForPrompt, null, 2)}

Improvement to apply:
- Issue: ${imp.issue || 'Improve this bullet'}
- Weak example (bullet to find & replace): ${imp.weak_example || ''}
- Strong example (guidance for improvement): ${imp.strong_example || ''}`

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
      return jsonWithRequestId({ error: 'No matching bullet found to improve', applied: false }, 422, requestId)
    }

    // Apply patch to resume data
    const updatedExperience = experience.map((exp) => {
      if (exp.id !== patch.experienceId) return exp

      const bullets = Array.isArray(exp.bullets) && exp.bullets.length > 0
        ? [...exp.bullets]
        : [exp.description || '']

      if (patch.bulletIndex >= 0 && patch.bulletIndex < bullets.length) {
        bullets[patch.bulletIndex] = patch.updatedBullet
      } else {
        // Claude returned out-of-range index — append or replace last
        if (bullets.length > 0) {
          bullets[bullets.length - 1] = patch.updatedBullet
        } else {
          bullets.push(patch.updatedBullet)
        }
      }

      const firstNonEmpty = bullets.find((b) => b.trim()) || bullets[0] || ''
      return { ...exp, bullets, description: firstNonEmpty }
    })

    const updatedData: ResumeData = { ...resumeData, experience: updatedExperience }

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ data: updatedData })
      .eq('id', body.resumeId)
      .eq('user_id', userId)

    if (updateError) {
      logger.error('apply-fix: failed to save resume', { requestId, userId, error: updateError.message })
      return jsonWithRequestId({ error: updateError.message }, 500, requestId)
    }

    // Record fix as applied (non-blocking)
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
      experienceId: patch.experienceId, bulletIndex: patch.bulletIndex,
    })

    return jsonWithRequestId({
      applied: true,
      experienceId: patch.experienceId,
      bulletIndex: patch.bulletIndex,
      updatedBullet: patch.updatedBullet,
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
