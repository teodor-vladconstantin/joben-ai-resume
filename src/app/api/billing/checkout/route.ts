import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { sendRateLimitEmailIfEligible } from '@/lib/email-automation'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getPriceIdForPlan, getUserPlan, type PaidPlan } from '@/lib/plans'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { getStripeClient, isStripeConfigured } from '@/lib/stripe'
import { checkoutRequestSchema } from '@/lib/validation/schemas'
import { PASS_14D_PRICE_BANI } from '@/lib/content'

export const runtime = 'nodejs'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Shown on the Stripe-hosted page (outside next-intl), hence kept here.
const PASS_COPY: Record<'ro' | 'en', { name: string; description: string; consent: (termsUrl: string) => string }> = {
  ro: {
    name: 'Joben Pass Interviu (14 zile)',
    description: 'Acces Pro timp de 14 zile. Plată unică, fără reînnoire automată.',
    consent: (termsUrl) =>
      `Sunt de acord cu [Termenii și Condițiile](${termsUrl}). Solicit începerea imediată a accesului Pro și iau la cunoștință că pierd dreptul de retragere de 14 zile odată ce accesul începe.`,
  },
  en: {
    name: 'Joben Interview Pass (14 days)',
    description: 'Pro access for 14 days. One-time payment with no automatic renewal.',
    consent: (termsUrl) =>
      `I agree to the [Terms and Conditions](${termsUrl}). I request that Pro access starts immediately and I acknowledge that I lose my 14-day right of withdrawal once access begins.`,
  },
}

// SECURITY: CLAUDE.md High #4 — throttle checkout session creation so a
// single user cannot spam Stripe session inventory and trigger rate limits
// for legitimate traffic.
const CHECKOUT_RATE_LIMIT_PER_HOUR = 10

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  // Kill switch: lets us pause new checkouts instantly (env var + redeploy)
  // without touching the webhook handler, which must keep processing
  // refunds/cancellations for existing subscribers regardless.
  if (process.env.CHECKOUT_DISABLED === 'true') {
    return jsonWithRequestId({ error: 'unavailable' }, 503, requestId)
  }

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

    let rawBody: unknown = {}
    const bodyText = await req.text()
    if (bodyText) {
      try {
        rawBody = JSON.parse(bodyText)
      } catch {
        return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
      }
    }

    const parsedBody = checkoutRequestSchema.safeParse(rawBody)
    if (!parsedBody.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }
    const requestedPlan: PaidPlan = parsedBody.data.plan ?? 'pro'
    const locale = parsedBody.data.locale ?? 'ro'

    const emailHint = getEmailHintFromSessionClaims(sessionClaims)
    const plan = await getUserPlan(userId, emailHint)

    const supabase = createServerClient()
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('clerk_id', userId)
      .maybeSingle()
    const hasSubscription = Boolean(profile?.stripe_subscription_id)
    const isPass = requestedPlan === 'pass_14d'

    // Recruiting (subscription, lifetime or god mode) covers everything.
    // Re-subscribing to the plan already held would create a second, parallel
    // subscription (double billing); a pass/referral grant is Pro without a
    // subscription, so those users can still subscribe. A pass on top of a
    // subscription buys nothing. (A pass during an active pass/referral grant
    // is fine: the webhook extends it.)
    if (
      plan === 'recruiting' ||
      (hasSubscription && (isPass || plan === requestedPlan))
    ) {
      return jsonWithRequestId({ error: 'already_active', currentPlan: plan }, 409, requestId)
    }

    const stripePriceId = getPriceIdForPlan(requestedPlan)
    if (!isStripeConfigured() || (!stripePriceId && !isPass)) {
      // SECURITY: CLAUDE.md Medium #6 — never leak which env vars are missing
      // to the client. Full diagnostic details stay in the server logs.
      logger.error('Stripe checkout config missing', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        plan: requestedPlan,
        hasStripeClient: isStripeConfigured(),
        hasStripePriceId: Boolean(stripePriceId),
      })
      return jsonWithRequestId({ error: 'unavailable' }, 503, requestId)
    }

    const clerkUser = await currentUser()
    const email = clerkUser?.emailAddresses[0]?.emailAddress || undefined
    const customerId = profile?.stripe_customer_id || undefined

    try {
      const stripe = getStripeClient()
      const copy = PASS_COPY[locale]
      const lineItem = stripePriceId
        ? { price: stripePriceId, quantity: 1 }
        : {
            price_data: {
              currency: 'ron',
              unit_amount: PASS_14D_PRICE_BANI,
              product_data: { name: copy.name, description: copy.description },
            },
            quantity: 1,
          }

      const session = await stripe.checkout.sessions.create({
        mode: isPass ? 'payment' : 'subscription',
        line_items: [lineItem],
        locale,
        success_url: `${appUrl}/${locale}/dashboard?upgrade=success${isPass ? '&pass=14d' : ''}`,
        cancel_url: `${appUrl}/${locale}/pricing?upgrade=cancelled`,
        metadata: {
          userId,
          planId: requestedPlan,
        },
        customer: customerId,
        customer_email: customerId ? undefined : email,
        allow_promotion_codes: true,
        ...(isPass
          ? {
              payment_method_types: ['card' as const],
              // Links refunds/disputes and future purchases to the user.
              ...(customerId ? {} : { customer_creation: 'always' as const }),
              // OUG 34/2014 art. 16 lit. m: express consent to immediate start
              // and acknowledgement of losing the withdrawal right. Requires a
              // terms of service URL in Stripe Dashboard > Settings > Public details.
              consent_collection: { terms_of_service: 'required' as const },
              custom_text: {
                terms_of_service_acceptance: {
                  message: copy.consent(`${appUrl}/${locale}/terms`),
                },
              },
            }
          : {}),
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
        properties: { plan: requestedPlan },
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
