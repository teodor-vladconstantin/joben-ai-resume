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

type FixPatch = {
  experienceId: string
  bulletIndex: number
  updatedBullet: string
}

type AutoFixResponse = {
  patches: FixPatch[]
  fixesApplied: number
}

const AUTO_FIX_SYSTEM = `You are an expert resume editor. Apply ALL improvement suggestions to the resume bullets.

Rules:
- For each improvement, find the bullet that best matches the "weak_example" and improve it
- Guided by "strong_example" but adapted to the ACTUAL original bullet text
- Keep bullets under 20 words; start with action verb
- NEVER invent metrics or numbers not present/implied in the original bullet
- Each bullet can only be patched once (pick the best matching one per improvement)
- Return ONLY valid JSON, no markdown, no preamble

Schema:
{
  "patches": [
    {
      "experienceId": "id of experience entry",
      "bulletIndex": 0,
      "updatedBullet": "improved text"
    }
  ],
  "fixesApplied": 2
}

If no improvements can be applied, return: { "patches": [], "fixesApplied": 0 }`

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
    improvements?: Improvement[]
  }

  if (!body.resumeId || !Array.isArray(body.improvements) || body.improvements.length === 0) {
    return jsonWithRequestId({ error: 'resumeId and improvements[] are required' }, 400, requestId)
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
      return jsonWithRequestId({ error: 'Resume has no experience to fix', fixesApplied: 0 }, 422, requestId)
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

    const messages: MessageParam[] = [{ role: 'user', content: prompt }]

    const aiResponse = await callAnthropicWithLimits({
      userId,
      plan,
      inputText: prompt,
      messages,
      system: AUTO_FIX_SYSTEM,
    })

    const responseText = extractTextFromAnthropicMessage(aiResponse)
    const result = parseClaudeJsonText(responseText) as AutoFixResponse

    const patches: FixPatch[] = Array.isArray(result?.patches) ? result.patches : []

    if (patches.length === 0) {
      return jsonWithRequestId({ fixesApplied: 0, patches: [] }, 200, requestId)
    }

    // Apply patches — validate each patch references a real experience entry and bullet
    const patchMap = new Map<string, Map<number, string>>()
    for (const patch of patches) {
      if (!patch.experienceId || patch.bulletIndex === undefined || !patch.updatedBullet?.trim()) continue

      const entry = experience.find((e) => e.id === patch.experienceId)
      if (!entry) continue

      const bullets = Array.isArray(entry.bullets) && entry.bullets.length > 0
        ? entry.bullets
        : [entry.description || '']

      const idx = patch.bulletIndex >= 0 && patch.bulletIndex < bullets.length
        ? patch.bulletIndex
        : bullets.length - 1

      if (!patchMap.has(patch.experienceId)) patchMap.set(patch.experienceId, new Map())
      patchMap.get(patch.experienceId)!.set(idx, patch.updatedBullet.trim())
    }

    const updatedExperience = experience.map((exp) => {
      const bulletPatches = patchMap.get(exp.id)
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

    const appliedCount = Array.from(patchMap.values()).reduce((sum, m) => sum + m.size, 0)
    const updatedData: ResumeData = { ...resumeData, experience: updatedExperience }

    const { error: updateError } = await supabase
      .from('resumes')
      .update({ data: updatedData })
      .eq('id', body.resumeId)
      .eq('user_id', userId)

    if (updateError) {
      logger.error('auto-fix: failed to save resume', { requestId, userId, error: updateError.message })
      return jsonWithRequestId({ error: updateError.message }, 500, requestId)
    }

    // Record as applied (non-blocking)
    if (body.reviewId) {
      void supabase.from('resume_analyses').insert({
        user_id: userId,
        resume_id: body.resumeId,
        review_id: body.reviewId,
        status: 'applied',
        applied_at: new Date().toISOString(),
        analysis_json: { fixesApplied: appliedCount, patches },
      })
    }

    logger.info('auto-fix: improvements applied', {
      requestId, userId, resumeId: body.resumeId, appliedCount,
    })

    return jsonWithRequestId({ fixesApplied: appliedCount, patches }, 200, requestId)
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
