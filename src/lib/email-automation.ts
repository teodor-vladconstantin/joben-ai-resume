import { createServerClient } from '@/lib/supabase/server'
import { sendRateLimitEmail, sendPaymentFailedEmail, sendWinbackEmail } from '@/lib/resend'
import { logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'

type RateLimitEmailTriggerInput = {
  userId: string
  requestId?: string
  route?: string
  reason?: string
  plan?: string
}

type PaymentFailedEmailTriggerInput = {
  userId: string
  requestId?: string
  invoiceId?: string
  subscriptionId?: string
  stripeEventId: string
}

type WinbackEmailTriggerInput = {
  userId: string
  requestId?: string
  subscriptionId: string
}

const RATE_LIMIT_EMAIL_TYPE = 'rate_limit_hit'
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000

const PAYMENT_FAILED_EMAIL_TYPE = 'payment_failed'
const PAYMENT_FAILED_RESEND_WINDOW_MS = 3 * 24 * 60 * 60 * 1000

const WINBACK_EMAIL_TYPE = 'winback'

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function buildSourceEventId(userId: string, now: number): string {
  const bucket = Math.floor(now / RATE_LIMIT_WINDOW_MS)
  return `rate-limit:${userId}:${bucket}`
}

function buildPaymentFailedSourceEventId(input: { invoiceId?: string; subscriptionId?: string; stripeEventId: string }): string {
  return `payment-failed:${input.invoiceId || input.subscriptionId || 'unknown'}:${input.stripeEventId}`
}

function buildWinbackSourceEventId(subscriptionId: string): string {
  return `winback:${subscriptionId}`
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

export async function sendPaymentFailedEmailIfEligible(input: PaymentFailedEmailTriggerInput): Promise<void> {
  try {
    const supabase = createServerClient()
    const now = Date.now()
    const cutoff = new Date(now - PAYMENT_FAILED_RESEND_WINDOW_MS).toISOString()

    const { data: recent, error: recentError } = await supabase
      .from('email_events')
      .select('id')
      .eq('user_clerk_id', input.userId)
      .eq('email_type', PAYMENT_FAILED_EMAIL_TYPE)
      .gte('created_at', cutoff)
      .limit(1)

    if (recentError) {
      logger.warn('Payment failed email lookup failed', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
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
      logger.warn('Payment failed email user lookup failed', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: userError.message,
      })
      return
    }

    if (!user?.email) {
      logger.warn('Payment failed email skipped due to missing email', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
      })
      return
    }

    const sourceEventId = buildPaymentFailedSourceEventId(input)

    const { error: lockError } = await supabase.from('email_events').insert({
      user_clerk_id: input.userId,
      email: user.email,
      email_type: PAYMENT_FAILED_EMAIL_TYPE,
      status: 'processing',
      source_event_id: sourceEventId,
      metadata: {
        source: 'stripe.payment_failed',
        invoiceId: input.invoiceId || null,
        subscriptionId: input.subscriptionId || null,
        stripeEventId: input.stripeEventId,
      },
    })

    if (lockError) {
      if (isDuplicateError(lockError)) {
        return
      }
      logger.warn('Payment failed email lock failed', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: lockError.message,
      })
      return
    }

    const result = await sendPaymentFailedEmail({
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
          source: 'stripe.payment_failed',
          invoiceId: input.invoiceId || null,
          subscriptionId: input.subscriptionId || null,
          stripeEventId: input.stripeEventId,
        },
      })
      .eq('source_event_id', sourceEventId)

    if (updateError) {
      logger.warn('Payment failed email event update failed', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: updateError.message,
      })
    }

    if (result.success) {
      await capturePostHogEvent({
        distinctId: input.userId,
        event: 'payment_failed_email_sent',
        properties: {
          invoiceId: input.invoiceId || null,
          subscriptionId: input.subscriptionId || null,
        },
      })
    } else {
      logger.warn('Payment failed email send failed', {
        source: 'sendPaymentFailedEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: result.error || 'Unknown email error',
      })
    }
  } catch (error) {
    logger.warn('Payment failed email flow failed', {
      source: 'sendPaymentFailedEmailIfEligible',
      userId: input.userId,
      requestId: input.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}

export async function sendWinbackEmailIfEligible(input: WinbackEmailTriggerInput): Promise<void> {
  try {
    const supabase = createServerClient()

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, first_name')
      .eq('clerk_id', input.userId)
      .maybeSingle()

    if (userError) {
      logger.warn('Winback email user lookup failed', {
        source: 'sendWinbackEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: userError.message,
      })
      return
    }

    if (!user?.email) {
      logger.warn('Winback email skipped due to missing email', {
        source: 'sendWinbackEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
      })
      return
    }

    const sourceEventId = buildWinbackSourceEventId(input.subscriptionId)

    const { error: lockError } = await supabase.from('email_events').insert({
      user_clerk_id: input.userId,
      email: user.email,
      email_type: WINBACK_EMAIL_TYPE,
      status: 'processing',
      source_event_id: sourceEventId,
      metadata: {
        source: 'stripe.subscription_deleted',
        subscriptionId: input.subscriptionId,
      },
    })

    if (lockError) {
      if (isDuplicateError(lockError)) {
        return
      }
      logger.warn('Winback email lock failed', {
        source: 'sendWinbackEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: lockError.message,
      })
      return
    }

    const result = await sendWinbackEmail({
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
          source: 'stripe.subscription_deleted',
          subscriptionId: input.subscriptionId,
        },
      })
      .eq('source_event_id', sourceEventId)

    if (updateError) {
      logger.warn('Winback email event update failed', {
        source: 'sendWinbackEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: updateError.message,
      })
    }

    if (result.success) {
      await capturePostHogEvent({
        distinctId: input.userId,
        event: 'winback_email_sent',
        properties: {
          subscriptionId: input.subscriptionId,
        },
      })
    } else {
      logger.warn('Winback email send failed', {
        source: 'sendWinbackEmailIfEligible',
        userId: input.userId,
        requestId: input.requestId,
        error: result.error || 'Unknown email error',
      })
    }
  } catch (error) {
    logger.warn('Winback email flow failed', {
      source: 'sendWinbackEmailIfEligible',
      userId: input.userId,
      requestId: input.requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
