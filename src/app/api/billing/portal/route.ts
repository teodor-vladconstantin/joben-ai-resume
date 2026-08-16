import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// SECURITY: mirrors the checkout route's throttle — the portal creates a
// live Stripe session too, so it shouldn't be spammable either.
const PORTAL_RATE_LIMIT_PER_HOUR = 10

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const limit = await checkRouteRateLimit({
      name: 'billing-portal',
      identifier: resolveRateLimitIdentity(req, userId),
      limit: PORTAL_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!limit.ok) {
      logger.warn('Billing portal rate-limit hit', {
        requestId,
        route: '/api/billing/portal',
        userId,
        retryAfter: limit.retryAfter,
      })
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

    if (!isStripeConfigured()) {
      logger.error('Stripe billing portal config missing', {
        requestId,
        route: '/api/billing/portal',
        userId,
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('unavailable', 'Billing is temporarily unavailable. Please try again later.') },
        503,
        requestId
      )
    }

    const supabase = createServerClient()
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', userId)
      .maybeSingle()

    if (profileError) {
      logger.error('Billing portal user lookup failed', {
        requestId,
        route: '/api/billing/portal',
        userId,
        error: profileError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    if (!profile?.stripe_customer_id) {
      return jsonWithRequestId(
        {
          error: clientErrorMessage(
            'not_found',
            'No billing account found. Subscribe to Pro first to manage billing.'
          ),
        },
        404,
        requestId
      )
    }

    try {
      const stripe = getStripeClient()
      const session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${appUrl}/settings`,
      })

      return jsonWithRequestId({ url: session.url }, 200, requestId)
    } catch (error) {
      logger.error('Stripe billing portal route failed', {
        requestId,
        route: '/api/billing/portal',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }
  } catch (error) {
    logger.error('Stripe billing portal route top-level failure', {
      requestId,
      route: '/api/billing/portal',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
