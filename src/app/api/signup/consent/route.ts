import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { getRedisClient } from '@/lib/ratelimit'

export const runtime = 'nodejs'

// Bump when Terms/Privacy copy materially changes so historical consent
// records stay attributable to the version the user actually agreed to.
const TOS_VERSION = '2026-08-13'

const SIGNUP_CONSENT_RATE_LIMIT_PER_HOUR = 6

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const redis = getRedisClient()
    if (!redis) {
      // SECURITY: deliberate deviation from this codebase's global fail-open
      // rate-limit policy. This is a low-traffic, abuse-specific gate (not
      // an AI-quota hot path), so a Redis outage should not silently allow
      // unlimited signup attempts from the same IP.
      logger.error('Signup consent unavailable: Redis not configured', { requestId, route: '/api/signup/consent' })
      return jsonWithRequestId({ error: clientErrorMessage('unavailable') }, 503, requestId)
    }

    const identity = resolveRateLimitIdentity(req)
    const limit = await checkRouteRateLimit({
      name: 'signup-consent',
      identifier: identity,
      limit: SIGNUP_CONSENT_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!limit.ok) {
      logger.warn('Signup consent rate-limit hit', { requestId, route: '/api/signup/consent', retryAfter: limit.retryAfter })
      return new Response(
        JSON.stringify({ error: clientErrorMessage('rate_limit') }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(limit.retryAfter),
            'x-request-id': requestId,
          },
        }
      )
    }

    const ipHash = identity.startsWith('ip:') ? identity.slice(3) : 'unknown'
    const token = crypto.randomUUID()

    const supabase = createServerClient()
    const { error } = await supabase.from('signup_consents').insert({
      token,
      ip_hash: ipHash,
      tos_version: TOS_VERSION,
    })

    if (error) {
      logger.error('Signup consent insert failed', { requestId, route: '/api/signup/consent', error: error.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    return jsonWithRequestId({ token }, 200, requestId)
  } catch (error) {
    logger.error('Signup consent route failed', {
      requestId,
      route: '/api/signup/consent',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
