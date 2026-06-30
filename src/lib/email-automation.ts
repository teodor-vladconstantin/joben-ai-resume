import { createServerClient } from '@/lib/supabase/server'
import { sendRateLimitEmail } from '@/lib/resend'
import { logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'

type RateLimitEmailTriggerInput = {
  userId: string
  requestId?: string
  route?: string
  reason?: string
  plan?: string
}

const RATE_LIMIT_EMAIL_TYPE = 'rate_limit_hit'
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function buildSourceEventId(userId: string, now: number): string {
  const bucket = Math.floor(now / RATE_LIMIT_WINDOW_MS)
  return `rate-limit:${userId}:${bucket}`
}

export async function sendRateLimitEmailIfEligible(input: RateLimitEmailTriggerInput): Promise<void> {
  // Captured on every call (not gated by the email dedup below) so product
  // analytics sees every limit hit, not just the first one per 24h window.
  await capturePostHogEvent({
    distinctId: input.userId,
    event: 'feature_limit_hit',
    properties: {
      feature: input.route?.replace(/^\/api\//, '') || 'unknown',
      plan: input.plan || null,
    },
  })

  try {
    const supabase = createServerClient()
    const now = Date.now()
    const cutoff = new Date(now - RATE_LIMIT_WINDOW_MS).toISOString()

    const { data: recent, error: recentError } = await supabase
      .from('email_events')
      .select('id')
      .eq('user_clerk_id', input.userId)
      .eq('email_type', RATE_LIMIT_EMAIL_TYPE)
      .gte('created_at', cutoff)
      .limit(1)

    if (recentError) {
      logger.warn('Rate limit email lookup failed', {
        source: 'sendRateLimitEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        route: input.route,
        error: recentError.message,
      })
    } else if (recent && recent.length > 0) {
      return
    }

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('clerk_id', input.userId)
      .maybeSingle()

    if (userError) {
      logger.warn('Rate limit email user lookup failed', {
        source: 'sendRateLimitEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        route: input.route,
        error: userError.message,
      })
      return
    }

    if (!user?.email) {
      logger.warn('Rate limit email skipped due to missing email', {
        source: 'sendRateLimitEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        route: input.route,
      })
      return
    }

    const sourceEventId = buildSourceEventId(input.userId, now)

    const { error: lockError } = await supabase.from('email_events').insert({
      user_clerk_id: input.userId,
      email: user.email,
      email_type: RATE_LIMIT_EMAIL_TYPE,
      status: 'processing',
      source_event_id: sourceEventId,
      metadata: {
        source: 'rate_limit',
        route: input.route || null,
        requestId: input.requestId || null,
        reason: input.reason || null,
      },
    })

    if (lockError) {
      if (isDuplicateError(lockError)) {
        return
      }
      logger.warn('Rate limit email lock failed', {
        source: 'sendRateLimitEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        route: input.route,
        error: lockError.message,
      })
      return
    }

    const result = await sendRateLimitEmail({
      to: user.email,
      firstName: user.first_name,
    })

    const { error: updateError } = await supabase
      .from('email_events')
      .update({
        status: result.success ? 'sent' : 'failed',
        provider_id: result.providerId || null,
        error: result.error || null,
        metadata: {
          source: 'rate_limit',
          route: input.route || null,
          requestId: input.requestId || null,
          reason: input.reason || null,
        },
      })
      .eq('source_event_id', sourceEventId)

    if (updateError) {
      logger.warn('Rate limit email event update failed', {
        source: 'sendRateLimitEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        route: input.route,
        error: updateError.message,
      })
    }
  } catch (error) {
    logger.warn('Rate limit email send failed', {
      source: 'sendRateLimitEmailIfEligible',
      userId: input.userId,
      requestId: input.requestId,
      route: input.route,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
