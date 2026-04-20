import { auth } from '@clerk/nextjs/server'
import { askClaudeForText } from '@/lib/claude'
import { enforceApiRateLimit } from '@/lib/api-rate-limit'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { trackProductEvent } from '@/lib/analytics'
import { getEmailHintFromSessionClaims, getUserPlan, hasBulletRewriteAccess } from '@/lib/plans'

const IMPROVE_BULLET_SYSTEM_PROMPT = `Rewrite the bullet in under 20 words using a strong action verb.
If numeric evidence is present and the source supports it, prefer this structure: [Action verb] X by Y using Z.
Example: Increased sales by 27% using email automation. (Action verb=Increased, X=sales, Y=27%, Z=email automation)
Do not invent metrics, tools, or outcomes. Include a metric only if implied by the source.
If the structure cannot be supported by the source, return the best concise action-impact bullet.
Return only the rewritten bullet.`

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId, sessionClaims } = await auth()
  if (!userId) {
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const emailHint = getEmailHintFromSessionClaims(sessionClaims)

  const plan = await getUserPlan(userId, emailHint)
  if (!hasBulletRewriteAccess(plan)) {
    return jsonWithRequestId(
      {
        error: 'AI bullet rewrite is not available on your current plan.',
        showUpgrade: true,
        requiredPlan: 'pro',
        currentPlan: plan,
      },
      403,
      requestId
    )
  }

  const body = (await req.json()) as { bullet?: string; context?: string }
  if (!body.bullet) {
    return jsonWithRequestId({ error: 'bullet is required' }, 400, requestId)
  }

  const apiLimit = await enforceApiRateLimit({
    route: 'improve-bullet',
    userId,
    plan,
  })

  if (!apiLimit.allowed) {
    logger.warn('Improve-bullet request blocked by rate limit', {
      requestId,
      userId,
      route: '/api/improve-bullet',
      plan,
      status: apiLimit.status,
      period: apiLimit.period,
      limit: apiLimit.limit,
      remaining: apiLimit.remaining,
      resetAt: apiLimit.resetAt,
    })

    return jsonWithRequestId(
      {
        error: apiLimit.error || 'Daily limit reached. Try again tomorrow.',
        showUpgrade: apiLimit.showUpgrade || false,
        currentPlan: plan,
        limit: apiLimit.limit,
        remaining: apiLimit.remaining,
        resetAt: apiLimit.resetAt,
      },
      apiLimit.status,
      requestId
    )
  }

  try {
    const hasNumericEvidence = /\d/.test(`${body.bullet} ${body.context || ''}`)

    const text = await askClaudeForText(
      IMPROVE_BULLET_SYSTEM_PROMPT,
      `Bullet: ${body.bullet}\nContext: ${body.context || 'N/A'}\nNumeric evidence present: ${hasNumericEvidence ? 'yes' : 'no'}`
    )
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
    const message = (error as Error).message
    logger.error('Improve-bullet route failed', {
      requestId,
      userId,
      route: '/api/improve-bullet',
      error: message,
    })
    return jsonWithRequestId({ error: message }, 500, requestId)
  }
}
