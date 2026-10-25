import { auth, currentUser } from '@clerk/nextjs/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendMobileHandoffEmail } from '@/lib/resend'
import { clientErrorMessage } from '@/lib/security/client-error'
import { getUpstashClient } from '@/lib/upstash'

export const runtime = 'nodejs'

const MAX_SENDS_PER_HOUR = 3

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const body = (await req.json().catch(() => null)) as { locale?: unknown } | null
    const locale = body?.locale === 'en' ? 'en' : 'ro'

    const redis = getUpstashClient()
    if (redis) {
      const key = `mobile-handoff:${userId}`
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, 3600)
      if (count > MAX_SENDS_PER_HOUR) {
        return jsonWithRequestId({ error: 'rate_limited' }, 429, requestId)
      }
    }

    const user = await currentUser()
    const to = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress
    if (!to) {
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 400, requestId)
    }

    const result = await sendMobileHandoffEmail({ to, locale })
    if (!result.success) {
      logger.warn('Mobile handoff email failed', { requestId, userId, error: result.error })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 502, requestId)
    }

    await capturePostHogEvent({ distinctId: userId, event: 'mobile_handoff_requested', properties: { locale } })
    return jsonWithRequestId({ success: true }, 200, requestId)
  } catch (error) {
    logger.error('Mobile handoff failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
