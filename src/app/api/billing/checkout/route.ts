import Stripe from 'stripe'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_PRO_PRICE_ID
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// SECURITY: CLAUDE.md High #4 — throttle checkout session creation so a
// single user cannot spam Stripe session inventory and trigger rate limits
// for legitimate traffic.
const CHECKOUT_RATE_LIMIT_PER_HOUR = 10

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId, sessionClaims } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    const limit = await checkRouteRateLimit({
      name: 'billing-checkout',
      identifier: resolveRateLimitIdentity(req, userId),
      limit: CHECKOUT_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
    })
    if (!limit.ok) {
      logger.warn('Checkout rate-limit hit', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        retryAfter: limit.retryAfter,
      })
      await sendRateLimitEmailIfEligible({
        userId,
        requestId,
        route: '/api/billing/checkout',
        reason: 'route_rate_limit',
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

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const plan = await getUserPlan(userId, emailHint)
    if (plan === 'recruiting') {
      return jsonWithRequestId(
        {
          error: 'Recruiting lifetime plan is already active for your account.',
          alreadyActive: true,
          currentPlan: plan,
        },
        409,
        requestId
      )
    }

    if (!stripe || !stripePriceId) {
      // SECURITY: CLAUDE.md Medium #6 — never leak which env vars are missing
      // to the client. Full diagnostic details stay in the server logs.
      logger.error('Stripe checkout config missing', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        hasStripeClient: Boolean(stripe),
        hasStripePriceId: Boolean(stripePriceId),
      })
      return jsonWithRequestId(
        { error: clientErrorMessage('unavailable', 'Billing is temporarily unavailable. Please try again later.') },
        503,
        requestId
      )
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress || undefined

    const supabase = createServerClient()
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('clerk_id', userId)
      .maybeSingle()

    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: stripePriceId,
            quantity: 1,
          },
        ],
        success_url: `${appUrl}/dashboard?upgrade=success`,
        cancel_url: `${appUrl}/dashboard?upgrade=cancelled`,
        metadata: {
          userId,
          planId: 'pro',
        },
        customer: profile?.stripe_customer_id || undefined,
        customer_email: profile?.stripe_customer_id ? undefined : email,
        allow_promotion_codes: true,
      })

      if (!session.url) {
        logger.error('Stripe checkout session created without URL', {
          requestId,
          route: '/api/billing/checkout',
          userId,
        })
        return jsonWithRequestId({ error: 'Could not create checkout session.' }, 500, requestId)
      }

      await trackProductEvent({
        userId,
        eventName: 'checkout_started',
        requestId,
        metadata: {
          sessionId: session.id,
        },
      })

      await capturePostHogEvent({
        distinctId: userId,
        event: 'checkout_started',
        properties: { plan: 'pro' },
      })

      return jsonWithRequestId({ url: session.url }, 200, requestId)
    } catch (error) {
      logger.error('Stripe checkout route failed', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }
  } catch (error) {
    logger.error('Stripe checkout route top-level failure', {
      requestId,
      route: '/api/billing/checkout',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
