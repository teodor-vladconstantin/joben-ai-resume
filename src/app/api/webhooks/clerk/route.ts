import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger, withRequestId } from '@/lib/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function isDuplicateEventError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    logger.error('CLERK_WEBHOOK_SECRET missing', {
      requestId,
      route: '/api/webhooks/clerk',
    })
    return jsonWithRequestId({ error: 'Webhook secret not configured' }, 500, requestId)
  }

  // Get the headers
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return withRequestId(new Response('Error occured -- no svix headers', {
      status: 400
    }), requestId)
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)

  const wh = new Webhook(WEBHOOK_SECRET)
  let evt: WebhookEvent

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    logger.error('Clerk webhook signature verification failed', {
      requestId,
      route: '/api/webhooks/clerk',
      eventId: svixId,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
    return withRequestId(new Response('Error occured', {
      status: 400
    }), requestId)
  }

  const eventType = evt.type

  // Init Supabase Service Role client to bypass RLS for server-side admin tasks
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  // Claim event first to make webhook handling idempotent across retries.
  const { error: claimError } = await supabase.from('webhook_events').insert({
    provider: 'clerk',
    event_id: svixId,
    event_type: eventType,
    payload,
  })

  if (claimError) {
    if (isDuplicateEventError(claimError)) {
      logger.info('Duplicate Clerk webhook ignored', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        eventType,
      })
      return jsonWithRequestId({ message: 'Duplicate webhook ignored' }, 200, requestId)
    }

    logger.error('Failed to claim clerk webhook event', {
      requestId,
      route: '/api/webhooks/clerk',
      eventId: svixId,
      eventType,
      error: claimError.message,
    })
    return jsonWithRequestId({ error: 'Could not claim webhook event' }, 500, requestId)
  }

  // Handle user creation
  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const primaryEmail = email_addresses?.[0]?.email_address ?? null

    const { error } = await supabase.from('users').upsert(
      {
        clerk_id: id,
        email: primaryEmail,
        first_name: first_name,
        last_name: last_name,
        avatar_url: image_url,
        plan: 'free',
      },
      { onConflict: 'clerk_id' }
    )
    
    if (error) {
      logger.error('Supabase upsert failed for user.created', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        userId: id,
        error: error.message,
      })
      return jsonWithRequestId({ error: error.message }, 500, requestId)
    }

    if (primaryEmail) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('welcome_sent_at')
        .eq('clerk_id', id)
        .maybeSingle()

      if (existingUserError) {
        logger.error('Supabase select failed for user.created', {
          requestId,
          route: '/api/webhooks/clerk',
          eventId: svixId,
          userId: id,
          error: existingUserError.message,
        })
        return jsonWithRequestId({ error: existingUserError.message }, 500, requestId)
      }

      const shouldSendWelcome = !existingUser?.welcome_sent_at

      if (shouldSendWelcome) {
        const welcomeResult = await sendWelcomeEmail({
          to: primaryEmail,
          firstName: first_name,
        })

        const { error: emailEventError } = await supabase
          .from('email_events')
          .insert({
            user_clerk_id: id,
            email: primaryEmail,
            email_type: 'welcome',
            status: welcomeResult.success ? 'sent' : 'failed',
            provider_id: welcomeResult.providerId || null,
            source_event_id: svixId,
            error: welcomeResult.error || null,
            metadata: { source: 'clerk.user.created', source_event_id: svixId },
          })

        if (emailEventError && !isDuplicateEventError(emailEventError)) {
          logger.error('Supabase insert failed for welcome email event', {
            requestId,
            route: '/api/webhooks/clerk',
            eventId: svixId,
            userId: id,
            error: emailEventError.message,
          })
        }

        if (welcomeResult.success) {
          const { error: welcomeMarkError } = await supabase
            .from('users')
            .update({ welcome_sent_at: new Date().toISOString() })
            .eq('clerk_id', id)

          if (welcomeMarkError) {
            logger.error('Failed to mark welcome_sent_at', {
              requestId,
              route: '/api/webhooks/clerk',
              eventId: svixId,
              userId: id,
              error: welcomeMarkError.message,
            })
          }
        } else {
          logger.error('Welcome email send failed', {
            requestId,
            route: '/api/webhooks/clerk',
            eventId: svixId,
            userId: id,
            error: welcomeResult.error || 'Unknown email error',
          })
        }
      }
    }
  }

  // Handle user updates
  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data
    const primaryEmail = email_addresses?.[0]?.email_address ?? null

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: id,
          email: primaryEmail,
          first_name: first_name,
          last_name: last_name,
          avatar_url: image_url,
        },
        { onConflict: 'clerk_id' }
      )
    
    if (error) {
      logger.error('Supabase upsert failed for user.updated', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        userId: id,
        error: error.message,
      })
      return jsonWithRequestId({ error: error.message }, 500, requestId)
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    const { id } = evt.data
    if (id) {
      const { error } = await supabase.from('users').delete().eq('clerk_id', id)
    
      if (error) {
        logger.error('Supabase delete failed for user.deleted', {
          requestId,
          route: '/api/webhooks/clerk',
          eventId: svixId,
          userId: id,
          error: error.message,
        })
        return jsonWithRequestId({ error: error.message }, 500, requestId)
      }
    }
  }

  logger.info('Clerk webhook processed', {
    requestId,
    route: '/api/webhooks/clerk',
    eventId: svixId,
    eventType,
  })
  return jsonWithRequestId({ message: 'Success' }, 200, requestId)
}