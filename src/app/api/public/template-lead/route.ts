import { z } from 'zod'
import { createClient } from '@supabase/supabase-js'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import { capturePostHogEvent, toBrowserDistinctId } from '@/lib/posthog-server'

export const runtime = 'nodejs'

const TEMPLATE_LEAD_RATE_LIMIT_PER_DAY = 10

// Bump when the terms/marketing copy shown in TemplateDownloadGate changes, so
// each stored consent maps to the exact wording the visitor saw.
const TEMPLATE_CONSENT_VERSION = '2026-10-26'

// termsAccepted is z.literal(true): the gate is not satisfied without it.
// marketingConsent is a separate optional opt-in and defaults to false.
const requestSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  templateId: z.enum(['classic', 'student', 'career-change']),
  locale: z.enum(['ro', 'en']),
  termsAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
  posthogDistinctId: z.unknown().optional(),
})

export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    const limit = await checkRouteRateLimit({
      name: 'public-template-lead',
      identifier: resolveRateLimitIdentity(req),
      limit: TEMPLATE_LEAD_RATE_LIMIT_PER_DAY,
      windowSeconds: 24 * 60 * 60,
      failClosed: true,
    })
    if (!limit.ok) {
      return jsonWithRequestId({ error: clientErrorMessage('rate_limit') }, 429, requestId)
    }

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = requestSchema.safeParse(body)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }
    const { email, templateId, locale, marketingConsent } = parsed.data
    // Client-supplied, so validated (rejects user_/anon: ids) before it can
    // attribute a server event to someone else.
    const posthogDistinctId = toBrowserDistinctId(parsed.data.posthogDistinctId)

    if (isDisposableEmailDomain(email)) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input', 'Please use a non-disposable email address.') }, 400, requestId)
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const now = new Date().toISOString()
    // First submission wins the row; a later visit never overwrites it.
    const { error: insertError } = await supabase
      .from('template_leads')
      .upsert(
        {
          email,
          template_id: templateId,
          locale,
          consent_version: TEMPLATE_CONSENT_VERSION,
          posthog_distinct_id: posthogDistinctId,
          marketing_consent: marketingConsent,
          marketing_consent_at: marketingConsent ? now : null,
        },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (insertError) {
      logger.error('Template lead insert failed', { requestId, route: '/api/public/template-lead', error: insertError.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    // A returning visitor can opt in later; ticking the box never gets undone
    // here (opting out goes through the unsubscribe link).
    if (marketingConsent) {
      const { error: optInError } = await supabase
        .from('template_leads')
        .update({ marketing_consent: true, marketing_consent_at: now, consent_version: TEMPLATE_CONSENT_VERSION })
        .eq('email', email)
        .eq('marketing_consent', false)

      if (optInError) {
        logger.warn('Template lead marketing opt-in update failed', { requestId, route: '/api/public/template-lead', error: optInError.message })
      }
    }

    // Only visitors who accepted analytics cookies send a distinct id.
    if (posthogDistinctId) {
      await capturePostHogEvent({
        distinctId: posthogDistinctId,
        event: 'template_lead_captured',
        properties: { templateId, locale, marketingConsent },
      })
    }

    return jsonWithRequestId({ success: true }, 200, requestId)
  } catch (error) {
    logger.error('Template lead top-level failure', {
      requestId,
      route: '/api/public/template-lead',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
