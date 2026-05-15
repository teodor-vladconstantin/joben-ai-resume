import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { parseClaudeJsonText } from '@/lib/claude-json'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
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
- Do not hallucinate facts.
- Do not use cliches.
- Keep language specific and concise.`

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
    const safeResume = sanitizeForPrompt(body.resumeText, { maxChars: 10_000 })
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
      return jsonWithRequestId({ result: generated }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        if (error.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/cover-letter',
            reason: error.payload?.limitType || 'rate_limit',
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
