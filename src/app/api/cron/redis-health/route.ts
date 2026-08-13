import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { isAuthorizedCronRequest } from '@/lib/cron-utils'
import { pingUpstash } from '@/lib/upstash'

export const runtime = 'nodejs'

// Rate limiting (src/lib/ratelimit.ts) fails open by design when Redis is
// unreachable — a deliberate availability tradeoff, but one that was
// previously silent (console.error only). This probe pushes a real alert
// (logger.error -> Sentry) so a Redis outage is noticed instead of quietly
// disabling AI-quota enforcement and monthly limits.
export async function POST(request: Request) {
  const requestId = getRequestId(request)

  if (!isAuthorizedCronRequest(request)) {
    logger.warn('Redis health cron request rejected: missing or invalid CRON_SECRET', {
      requestId,
      route: '/api/cron/redis-health',
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
    })
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const result = await pingUpstash(2500)

  if (!result.ok) {
    logger.error('Upstash Redis health check failed', {
      requestId,
      route: '/api/cron/redis-health',
      reason: result.reason,
    })
    return jsonWithRequestId({ ok: false, reason: result.reason }, 200, requestId)
  }

  return jsonWithRequestId({ ok: true }, 200, requestId)
}

// Vercel Cron Jobs always invoke via GET — alias so the schedule actually
// fires (same fix already applied to inactivity-3d/followup-7d).
export const GET = POST
