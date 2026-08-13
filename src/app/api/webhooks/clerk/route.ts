import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { sendWelcomeEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { isDisposableEmailDomain, normalizeEmail } from '@/lib/security/disposable-email'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function isDuplicateEventError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
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
      return jsonWithRequestId({ error: 'Missing svix headers' }, 400, requestId)
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
      return jsonWithRequestId({ error: 'Signature verification failed' }, 400, requestId)
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
    const { id, email_addresses, first_name, last_name } = evt.data
    const primaryEmail = normalizeEmail(email_addresses?.[0]?.email_address)

    if (isDisposableEmailDomain(primaryEmail)) {
      logger.error('Blocked signup: disposable email domain', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        userId: id,
      })
      await capturePostHogEvent({
        distinctId: id,
        event: 'signup_blocked_disposable_email',
        properties: { method: 'clerk' },
      })
      try {
        const client = await clerkClient()
        await client.users.deleteUser(id)
      } catch (deleteError) {
        logger.error('Failed to delete Clerk user with disposable email', {
          requestId,
          route: '/api/webhooks/clerk',
          eventId: svixId,
          userId: id,
          error: deleteError instanceof Error ? deleteError.message : 'Unknown error',
        })
      }
      // Return 200 (event already claimed via webhook_events) so svix does
      // not retry-storm; no `users` row is created, so no free-tier quota
      // is ever granted for this account.
      return jsonWithRequestId({ message: 'Signup blocked' }, 200, requestId)
    }

    if (email_addresses?.[0]?.verification?.status !== 'verified') {
      logger.warn('Signup completed with unverified email', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        userId: id,
      })
    }

    const consentFields: { tos_accepted_at?: string; tos_version?: string; signup_ip_hash?: string } = {}
    const consentToken = evt.data.unsafe_metadata?.consentToken
    if (typeof consentToken === 'string' && consentToken.length > 0) {
      const { data: consent, error: consentLookupError } = await supabase
        .from('signup_consents')
        .select('ip_hash, tos_version, consumed_at, expires_at')
        .eq('token', consentToken)
        .maybeSingle()

      if (consentLookupError) {
        logger.warn('Signup consent lookup failed', {
          requestId,
          route: '/api/webhooks/clerk',
          eventId: svixId,
          userId: id,
          error: consentLookupError.message,
        })
      } else if (consent && !consent.consumed_at && new Date(consent.expires_at) > new Date()) {
        await supabase
          .from('signup_consents')
          .update({ consumed_at: new Date().toISOString() })
          .eq('token', consentToken)
        consentFields.tos_accepted_at = new Date().toISOString()
        consentFields.tos_version = consent.tos_version
        consentFields.signup_ip_hash = consent.ip_hash
      } else {
        logger.warn('Signup consent token missing, consumed, or expired', {
          requestId,
          route: '/api/webhooks/clerk',
          eventId: svixId,
          userId: id,
        })
      }
    } else {
      // SECURITY: not a hard gate — consistent with this codebase's bias
      // toward availability — but auditable in Sentry.
      logger.warn('Signup completed without verifiable ToS consent', {
        requestId,
        route: '/api/webhooks/clerk',
        eventId: svixId,
        userId: id,
      })
    }

    const { error } = await supabase.from('users').upsert(
      {
        clerk_id: id,
        email: primaryEmail,
        first_name: first_name,
        last_name: last_name,
        ...consentFields,
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
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    await capturePostHogEvent({
      distinctId: id,
      event: 'signup_completed',
      properties: { method: 'clerk' },
    })

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
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
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
    const { id, email_addresses, first_name, last_name } = evt.data
    const primaryEmail = normalizeEmail(email_addresses?.[0]?.email_address)

    const { error } = await supabase
      .from('users')
      .upsert(
        {
          clerk_id: id,
          email: primaryEmail,
          first_name: first_name,
          last_name: last_name,
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
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
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
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
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
  } catch (error) {
    logger.error('Clerk webhook top-level failure', {
      requestId,
      route: '/api/webhooks/clerk',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}