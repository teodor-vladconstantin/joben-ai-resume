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
import { sanitizeForPrompt, sanitizeJsonForPrompt } from '@/lib/security/prompt-sanitizer'
import { tailorSchema } from '@/lib/validation/schemas'

const TAILOR_SYSTEM_PROMPT = `Optimize resume bullets for the target job. Return ONLY JSON:
{
  "updatedBullets": ["string"],
  "summary": "string"
}`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)

    const plan = await getUserPlan(userId, emailHint)

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = tailorSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    // SECURITY: sanitize both the JD string and every nested string inside
    // the resumeData blob before they land in the prompt.
    const safeResumeData = sanitizeJsonForPrompt(body.resumeData, { maxChars: 5_000 })
    const safeJobDescription = sanitizeForPrompt(body.jobDescription, { maxChars: 10_000 })

    try {
      const prompt = `Optimization type: ${body.optimizationType || 'general'}\n\nResume data:\n${JSON.stringify(safeResumeData)}\n\nJob description:\n${safeJobDescription}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: prompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'jds',
        inputText: prompt,
        messages,
        system: TAILOR_SYSTEM_PROMPT,
      })

      const result = parseClaudeJsonText(extractTextFromAnthropicMessage(aiResponse))
      logger.info('Tailor request completed', {
        requestId,
        userId,
        route: '/api/tailor',
        optimizationType: body.optimizationType || 'general',
      })
      return jsonWithRequestId({ result }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        if (error.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/tailor',
            reason: error.payload?.limitType || 'rate_limit',
          })
        }
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Tailor route failed', {
        requestId,
        userId,
        route: '/api/tailor',
        error: rawMessage,
      })
      return jsonWithRequestId({ error: stripProviderMentions(rawMessage) }, 500, requestId)
    }
  } catch (error) {
    logger.error('Tailor route top-level failure', {
      requestId,
      route: '/api/tailor',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
