import Stripe from 'stripe'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { trackProductEvent } from '@/lib/analytics'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getEmailHintFromSessionClaims, getUserPlan } from '@/lib/plans'
import { getErrorMessage } from '@/lib/api-response'

export const runtime = 'nodejs'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const stripePriceId = process.env.STRIPE_PRO_PRICE_ID
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

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
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
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
      logger.error('Stripe checkout config missing', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        hasStripeClient: Boolean(stripe),
        hasStripePriceId: Boolean(stripePriceId),
      })
      return jsonWithRequestId(
        { error: 'Billing is not configured. Missing STRIPE_SECRET_KEY or STRIPE_PRO_PRICE_ID.' },
        500,
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

      return jsonWithRequestId({ url: session.url }, 200, requestId)
    } catch (error) {
      const message = getErrorMessage(error)
      logger.error('Stripe checkout route failed', {
        requestId,
        route: '/api/billing/checkout',
        userId,
        error: message,
      })
      return jsonWithRequestId({ error: message }, 500, requestId)
    }
  } catch (error) {
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}
