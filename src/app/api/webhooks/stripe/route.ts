import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function isDuplicateEventError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function resolvePlanFromSubscription(subscription: Stripe.Subscription): 'free' | 'pro' {
  const proStatuses = new Set<Stripe.Subscription.Status>(['active', 'trialing', 'past_due'])
  return proStatuses.has(subscription.status) ? 'pro' : 'free'
}

function isStaleEvent(lastProcessedAt: number | null | undefined, incomingEventCreated: number): boolean {
  return typeof lastProcessedAt === 'number' && lastProcessedAt > incomingEventCreated
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    logger.error('STRIPE_WEBHOOK_SECRET missing', {
      requestId,
      route: '/api/webhooks/stripe',
    })
    return jsonWithRequestId({ error: 'Webhook Error: STRIPE_WEBHOOK_SECRET is not set' }, 500, requestId)
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return jsonWithRequestId({ error: 'Webhook Error: Missing stripe-signature header' }, 400, requestId)
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Stripe webhook signature verification failed', {
      requestId,
      route: '/api/webhooks/stripe',
      error: message,
    })
    return jsonWithRequestId({ error: `Webhook Error: ${message}` }, 400, requestId)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body) as Record<string, unknown>
  } catch {
    return jsonWithRequestId({ error: 'Webhook Error: invalid JSON payload' }, 400, requestId)
  }
  const eventCreated = typeof event.created === 'number' ? event.created : Math.floor(Date.now() / 1000)

  const { error: claimError } = await supabase.from('webhook_events').insert({
    provider: 'stripe',
    event_id: event.id,
    event_type: event.type,
    payload,
  })

  if (claimError) {
    if (isDuplicateEventError(claimError)) {
      logger.info('Duplicate Stripe webhook ignored', {
        requestId,
        route: '/api/webhooks/stripe',
        eventId: event.id,
        eventType: event.type,
      })
      return jsonWithRequestId({ message: 'Duplicate webhook ignored' }, 200, requestId)
    }

    logger.error('Failed to claim stripe webhook event', {
      requestId,
      route: '/api/webhooks/stripe',
      eventId: event.id,
      eventType: event.type,
      error: claimError.message,
    })
    return jsonWithRequestId({ error: 'Webhook Error: failed to claim event' }, 500, requestId)
  }

  const syncPlanFromSubscription = async (
    customerId: string,
    subscription: Stripe.Subscription
  ): Promise<Response | null> => {
    const { data: user, error: userLookupError } = await supabase
      .from('users')
      .select('id, stripe_last_event_created, lifetime_recruiting_unlocked')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()

    if (userLookupError) {
      logger.error('Stripe webhook user lookup by customer failed', {
        requestId,
        route: '/api/webhooks/stripe',
        customerId,
        eventId: event.id,
        eventType: event.type,
        error: userLookupError.message,
      })
      return jsonWithRequestId({ error: 'Webhook Error: database lookup failed' }, 500, requestId)
    }

    if (!user) {
      logger.warn('Stripe webhook customer not linked to user, skipping sync', {
        requestId,
        route: '/api/webhooks/stripe',
        customerId,
        eventId: event.id,
        eventType: event.type,
      })
      return null
    }

    if (isStaleEvent(user.stripe_last_event_created, eventCreated)) {
      logger.info('Stale Stripe webhook event ignored for customer sync', {
        requestId,
        route: '/api/webhooks/stripe',
        customerId,
        eventId: event.id,
        eventType: event.type,
        userId: user.id,
        lastProcessedAt: user.stripe_last_event_created,
        eventCreated,
      })
      return null
    }

    if (user.lifetime_recruiting_unlocked) {
      const { error } = await supabase
        .from('users')
        .update({
          plan: 'recruiting',
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId,
          stripe_last_event_created: eventCreated,
        })
        .eq('id', user.id)

      if (error) {
        logger.error('Stripe webhook lifetime recruiting sync failed', {
          requestId,
          route: '/api/webhooks/stripe',
          customerId,
          subscriptionId: subscription.id,
          eventId: event.id,
          eventType: event.type,
          error: error.message,
        })
        return jsonWithRequestId({ error: 'Webhook Error: database update failed' }, 500, requestId)
      }

      logger.info('Skipped stripe plan downgrade due to lifetime recruiting override', {
        requestId,
        route: '/api/webhooks/stripe',
        customerId,
        userId: user.id,
        eventId: event.id,
        eventType: event.type,
      })
      return null
    }

    const plan = resolvePlanFromSubscription(subscription)
    const stripeSubscriptionId = plan === 'pro' ? subscription.id : null

    const { error } = await supabase
      .from('users')
      .update({
        plan,
        stripe_subscription_id: stripeSubscriptionId,
        stripe_customer_id: customerId,
        stripe_last_event_created: eventCreated,
      })
      .eq('id', user.id)

    if (error) {
      logger.error('Stripe webhook subscription sync failed', {
        requestId,
        route: '/api/webhooks/stripe',
        customerId,
        subscriptionId: subscription.id,
        eventId: event.id,
        eventType: event.type,
        error: error.message,
      })
      return jsonWithRequestId({ error: 'Webhook Error: database update failed' }, 500, requestId)
    }

    return null
  }

  try {
    // Handle successful checkout
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { userId, planId } = session.metadata || {}

      if (userId) {
        const { data: user, error: userLookupError } = await supabase
          .from('users')
          .select('id, stripe_last_event_created, lifetime_recruiting_unlocked')
          .eq('clerk_id', userId)
          .maybeSingle()

        if (userLookupError) {
          logger.error('Stripe checkout user lookup failed', {
            requestId,
            route: '/api/webhooks/stripe',
            userId,
            eventId: event.id,
            eventType: event.type,
            error: userLookupError.message,
          })
          return jsonWithRequestId({ error: 'Webhook Error: database lookup failed' }, 500, requestId)
        }

        if (!user) {
          logger.warn('Stripe checkout user not found, skipping sync', {
            requestId,
            route: '/api/webhooks/stripe',
            userId,
            eventId: event.id,
            eventType: event.type,
          })
        }

        if (user && isStaleEvent(user.stripe_last_event_created, eventCreated)) {
          logger.info('Stale Stripe checkout event ignored', {
            requestId,
            route: '/api/webhooks/stripe',
            userId,
            eventId: event.id,
            eventType: event.type,
            lastProcessedAt: user.stripe_last_event_created,
            eventCreated,
          })
          return jsonWithRequestId({ message: 'Stale webhook ignored' }, 200, requestId)
        }

        const updatePayload: {
          plan?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          stripe_last_event_created?: number
        } = {}

        if (user?.lifetime_recruiting_unlocked) {
          updatePayload.plan = 'recruiting'
        } else if (planId) {
          updatePayload.plan = planId
        } else if (typeof session.subscription === 'string') {
          updatePayload.plan = 'pro'
        }

        if (typeof session.customer === 'string') {
          updatePayload.stripe_customer_id = session.customer
        }
        if (typeof session.subscription === 'string') {
          updatePayload.stripe_subscription_id = session.subscription
        }
        updatePayload.stripe_last_event_created = eventCreated

        if (user && Object.keys(updatePayload).length > 0) {
          const { error } = await supabase
            .from('users')
            .update(updatePayload)
            .eq('id', user.id)

          if (error) {
            logger.error('Stripe checkout sync failed', {
              requestId,
              route: '/api/webhooks/stripe',
              userId,
              eventId: event.id,
              eventType: event.type,
              error: error.message,
            })
            return jsonWithRequestId({ error: 'Webhook Error: database update failed' }, 500, requestId)
          }
        }
      }
    }

    // Handle subscription creation events that can arrive independently of checkout metadata.
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription
      if (typeof subscription.customer === 'string') {
        const response = await syncPlanFromSubscription(subscription.customer, subscription)
        if (response) {
          return response
        }
      }
    }

    // Sync plan when subscription status changes.
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription
      if (typeof subscription.customer === 'string') {
        const response = await syncPlanFromSubscription(subscription.customer, subscription)
        if (response) {
          return response
        }
      }
    }

    // Handle canceled subscription
    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription
      if (typeof subscription.customer === 'string') {
        const response = await syncPlanFromSubscription(subscription.customer, subscription)
        if (response) {
          return response
        }
      }
    }

    // Handle payment failures by resyncing user plan from invoice subscription state.
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      if (typeof invoice.customer === 'string') {
        const subscriptionRef = invoice.parent?.subscription_details?.subscription
        let subscription: Stripe.Subscription | null = null

        if (typeof subscriptionRef === 'string') {
          subscription = await stripe.subscriptions.retrieve(subscriptionRef)
        } else if (subscriptionRef) {
          subscription = subscriptionRef
        }

        if (subscription) {
          const response = await syncPlanFromSubscription(invoice.customer, subscription)
          if (response) {
            return response
          }
        }
      }
    }

    // Handle successful invoice payments by resyncing latest subscription state.
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object as Stripe.Invoice
      if (typeof invoice.customer === 'string') {
        const subscriptionRef = invoice.parent?.subscription_details?.subscription
        let subscription: Stripe.Subscription | null = null

        if (typeof subscriptionRef === 'string') {
          subscription = await stripe.subscriptions.retrieve(subscriptionRef)
        } else if (subscriptionRef) {
          subscription = subscriptionRef
        }

        if (subscription) {
          const response = await syncPlanFromSubscription(invoice.customer, subscription)
          if (response) {
            return response
          }
        }
      }
    }

    // Handle refunds by re-checking the latest subscription state for that customer.
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      if (typeof charge.customer === 'string') {
        const subscriptions = await stripe.subscriptions.list({
          customer: charge.customer,
          status: 'all',
          limit: 1,
        })

        const latestSubscription = subscriptions.data[0]
        if (latestSubscription) {
          const response = await syncPlanFromSubscription(charge.customer, latestSubscription)
          if (response) {
            return response
          }
        }
      }
    }
  } catch (err) {
    // SECURITY: Stripe webhook errors must not echo raw exception text back
    // to Stripe (or anyone replaying the request). Stripe only needs to
    // know the call failed; the diagnostic stays in the server log.
    const rawMessage = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Stripe webhook handling failed', {
      requestId,
      route: '/api/webhooks/stripe',
      error: rawMessage,
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }

  logger.info('Stripe webhook processed', {
    requestId,
    route: '/api/webhooks/stripe',
    eventId: event.id,
    eventType: event.type,
  })
  return jsonWithRequestId({ message: 'Webhook received' }, 200, requestId)
}