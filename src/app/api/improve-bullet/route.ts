import { auth } from '@clerk/nextjs/server'
import {
  callAnthropicWithLimits,
  extractTextFromAnthropicMessage,
  isRateLimitExceededError,
  MessageParam,
} from '@/lib/anthropic-with-limits'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { trackProductEvent } from '@/lib/analytics'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { stripProviderMentions } from '@/lib/ai-errors'
import { clientErrorMessage } from '@/lib/security/client-error'
import { sanitizeForPrompt } from '@/lib/security/prompt-sanitizer'
import { improveBulletSchema } from '@/lib/validation/schemas'

const IMPROVE_BULLET_SYSTEM_PROMPT = `Rewrite the bullet in under 20 words using a strong action verb.
If numeric evidence is present and the source supports it, prefer this structure: [Action verb] X by Y using Z.
Example: Increased sales by 27% using email automation. (Action verb=Increased, X=sales, Y=27%, Z=email automation)
Do not invent metrics, tools, or outcomes. Include a metric only if implied by the source.
If the structure cannot be supported by the source, return the best concise action-impact bullet.
Return only the rewritten bullet.`

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

    const parsed = improveBulletSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    // SECURITY: sanitize user-supplied bullet/context before prompt build.
    const safeBullet = sanitizeForPrompt(body.bullet, { maxChars: 2_000 })
    const safeContext = sanitizeForPrompt(body.context, { maxChars: 6_000 })

    if (!safeBullet) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    try {
      const hasNumericEvidence = /\d/.test(`${safeBullet} ${safeContext}`)
      const userPrompt = `Bullet: ${safeBullet}\nContext: ${safeContext || 'N/A'}\nNumeric evidence present: ${hasNumericEvidence ? 'yes' : 'no'}`
      const messages: MessageParam[] = [
        {
          role: 'user',
          content: userPrompt,
        },
      ]

      const aiResponse = await callAnthropicWithLimits({
        userId,
        plan,
        feature: 'bullets',
        inputText: userPrompt,
        messages,
        system: IMPROVE_BULLET_SYSTEM_PROMPT,
      })

      const text = extractTextFromAnthropicMessage(aiResponse)
      logger.info('Bullet improved', {
        requestId,
        userId,
        route: '/api/improve-bullet',
      })

      await trackProductEvent({
        userId,
        eventName: 'bullet_improved',
        requestId,
        metadata: {
          hasContext: Boolean(body.context?.trim()),
        },
      })

      return jsonWithRequestId({ bullet: text.trim() }, 200, requestId)
    } catch (error) {
      if (isRateLimitExceededError(error)) {
        if (error.status === 429) {
          await sendRateLimitEmailIfEligible({
            userId,
            requestId,
            route: '/api/improve-bullet',
            reason: error.payload?.limitType || 'rate_limit',
          })
        }
        return jsonWithRequestId(error.payload, error.status, requestId)
      }

      const rawMessage = error instanceof Error ? error.message : 'Unknown error'
      logger.error('Improve-bullet route failed', {
        requestId,
        userId,
        route: '/api/improve-bullet',
        error: rawMessage,
      })
      return jsonWithRequestId({ error: stripProviderMentions(rawMessage) }, 500, requestId)
    }
  } catch (error) {
    logger.error('Improve-bullet route top-level failure', {
      requestId,
      route: '/api/improve-bullet',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
