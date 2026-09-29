import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { resumeToPlainText } from '@/lib/resume-text'
import { careerSpanLine } from '@/lib/summary-grounding'
import { createServerClient } from '@/lib/supabase/server'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { stripProviderMentions } from '@/lib/ai-errors'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt } from '@/lib/security/prompt-sanitizer'
import { coverLetterAiSchema } from '@/lib/validation/schemas'

const COVER_LETTER_SYSTEM_PROMPT = `Generate a cover letter JSON with this exact shape:
{
  "salutation": "string",
  "paragraphs": ["string", "string", "string"],
  "closing": "string"
}

Rules:
- Every claim about the candidate (roles, employers, skills, numbers, achievements) must come from the Resume. Never invent experience.
- If the resume does not support a requirement from the job description, leave that requirement out entirely: do not claim it and do not point out that it is missing.
- Describe people, teams and scale exactly as the resume does (a team of 4 students stays 4 students, not 4 developers), and do not add adjectives about complexity or impact that the resume does not use.
- Mention years of experience only as given by the "Career span" line; never compute or estimate them yourself.
- Write in the language of the job description.
- Do not use cliches.
- Keep language specific and concise.`

// The builder used to send the cover letter's own text (placeholders on a new
// letter) as "resume", so the model had no real facts and made them up. The
// source is now the user's actual resume: the one given, else the latest.
async function loadResumeText(userId: string, resumeId: string | undefined): Promise<string> {
  const supabase = createServerClient()
  let query = supabase.from('resumes').select('data').eq('user_id', userId)
  query = resumeId ? query.eq('id', resumeId) : query.order('updated_at', { ascending: false })
  const { data } = await query.limit(1).maybeSingle()
  const resume = data?.data
  if (!resume || typeof resume !== 'object') return ''
  // The model miscounts years from date ranges ("3+ years" for a 2021 start).
  return [careerSpanLine(resume as Record<string, unknown>), resumeToPlainText(resume)].filter(Boolean).join('\n')
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
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

    const parsed = coverLetterAiSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data

    // SECURITY: every free-text field going to Anthropic must be sanitized.
    const resumeText = (await loadResumeText(userId, body.resumeId)) || body.resumeText || ''
    if (!resumeText.trim()) {
      return jsonWithRequestId(
        { error: clientErrorMessage('invalid_input', 'Create or import a resume first so the letter can use your real experience.'), code: 'no_resume' },
        400,
        requestId
      )
    }
    const safeResume = sanitizeForPrompt(resumeText, { maxChars: 10_000 })
    const safeCompany = sanitizeForPrompt(body.company, { maxChars: 500 })
    const safePosition = sanitizeForPrompt(body.position, { maxChars: 500 })
    const safeJobDescription = sanitizeForPrompt(body.jobDescription, { maxChars: 10_000 })
    const safeTone = sanitizeForPrompt(body.tone, { maxChars: 200 })

    const plan = await getUserPlan(userId, emailHint)

    try {
      const prompt = `Resume:\n${safeResume || 'N/A'}\n\nCompany: ${safeCompany}\nPosition: ${safePosition}\nTone: ${safeTone || 'professional'}\n\nJob description:\n${safeJobDescription}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'covers',
        inputText: prompt,
        messages,
        system: COVER_LETTER_SYSTEM_PROMPT,
      })

      const generated = parseClaudeJsonText(extractTextFromAnthropicMessage(aiResponse))

      await capturePostHogEvent({
        distinctId: userId,
        event: 'ai_rewrite_used',
        properties: { feature: 'cover_letter' },
      })

      return jsonWithRequestId({ result: generated }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        if (error.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/cover-letter',
            reason: error.payload?.limitType || 'rate_limit',
            plan,
          })
        }
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Cover letter AI route failed', {
        requestId,
        userId,
        route: '/api/cover-letter',
        error: rawMessage,
      })
      return jsonWithRequestId({ error: stripProviderMentions(rawMessage) }, 500, requestId)
    }
  } catch (error) {
    logger.error('Cover letter AI route top-level failure', {
      requestId,
      route: '/api/cover-letter',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
