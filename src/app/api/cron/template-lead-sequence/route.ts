import { createServerClient } from '@/lib/supabase/server'
import { sendTemplateSequenceEmail, toAnonScanEmailLocale } from '@/lib/resend'
import {
  TEMPLATE_SEQUENCE_OFFSET_DAYS,
  TEMPLATE_SEQUENCE_STEPS,
  type TemplateSequenceStep,
} from '@/lib/template-sequence-copy'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { isDisposableEmailDomain } from '@/lib/security/disposable-email'
import {
  isAuthorizedCronRequest,
  isDuplicateKeyError,
  parseCronOptions,
  sendEmailWithRetry,
} from '@/lib/cron-utils'

export const runtime = 'nodejs'

const ROUTE = '/api/cron/template-lead-sequence'
const DAY_MS = 24 * 60 * 60 * 1000
// Leads older than this are out of the sequence, so a paused cron never mails
// a long-confirmed lead the whole series at once.
const MAX_AGE_DAYS = 30

type Lead = {
  id: string
  email: string
  locale: string | null
  email_confirmed_at: string
}

// Sends at most one step per lead per run: the first due step without an
// email_events lock. The lock (not a status column) is the single source of
// truth for "already sent", same as the anonymous-scan crons.
export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorizedCronRequest(request)) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseCronOptions(request)
    const supabase = createServerClient()
    const now = Date.now()

    const { data, error } = await supabase
      .from('template_leads')
      .select('id, email, locale, email_confirmed_at')
      .eq('marketing_consent', true)
      .not('email_confirmed_at', 'is', null)
      .gte('email_confirmed_at', new Date(now - MAX_AGE_DAYS * DAY_MS).toISOString())
      .limit(options.limit)

    if (error) {
      logger.error('Failed to load template-lead sequence candidates', { requestId, route: ROUTE, error: error.message })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const leads = (data || []) as Lead[]
    const emails = [...new Set(leads.map((lead) => lead.email))]

    // A lead that already has an account is skipped: the sequence is for
    // people who have not signed up yet.
    const accounted = new Set<string>()
    if (emails.length > 0) {
      const { data: users, error: usersError } = await supabase.from('users').select('email').in('email', emails)
      if (usersError) {
        logger.error('Failed to check existing accounts for template-lead sequence', { requestId, route: ROUTE, error: usersError.message })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }
      for (const row of users || []) if (row?.email) accounted.add(row.email)
    }

    const eligible = leads.filter((lead) => !accounted.has(lead.email) && !isDisposableEmailDomain(lead.email))

    if (options.dryRun) {
      return jsonWithRequestId({ dryRun: true, scanned: leads.length, eligible: eligible.length }, 200, requestId)
    }

    let sent = 0
    let suppressed = 0
    let failed = 0

    for (const lead of eligible) {
      const ageDays = Math.floor((now - new Date(lead.email_confirmed_at).getTime()) / DAY_MS)

      for (const step of TEMPLATE_SEQUENCE_STEPS) {
        if (ageDays < TEMPLATE_SEQUENCE_OFFSET_DAYS[step]) break

        const sourceEventId = `template-seq-${step}:${lead.id}`
        const emailType = `template_seq_${step}`
        const { error: lockError } = await supabase.from('email_events').insert({
          user_clerk_id: `lead:${lead.id}`,
          email: lead.email,
          email_type: emailType,
          status: 'processing',
          source_event_id: sourceEventId,
          metadata: { source: 'cron.template-lead-sequence', step },
        })

        if (lockError) {
          if (isDuplicateKeyError(lockError)) continue // step already handled, try the next one
          failed += 1
          logger.error('Failed to claim template-lead sequence lock', { requestId, route: ROUTE, leadId: lead.id, step, error: lockError.message })
          break
        }

        const result = await sendEmailWithRetry(
          ({ to }) => sendTemplateSequenceEmail({ to, step: step as TemplateSequenceStep, locale: toAnonScanEmailLocale(lead.locale) }),
          { to: lead.email, firstName: null, maxRetries: options.maxRetries }
        )

        if (!result.success) {
          failed += 1
          logger.error('Template-lead sequence email failed', { requestId, route: ROUTE, leadId: lead.id, step, error: result.error })
          // Releasing the lock lets the next daily run retry this step.
          await supabase
            .from('email_events')
            .update({ status: 'failed', error: result.error, source_event_id: null })
            .eq('source_event_id', sourceEventId)
          break
        }

        await supabase
          .from('email_events')
          .update({ status: result.suppressed ? 'suppressed' : 'sent', provider_id: result.providerId || null, error: null })
          .eq('source_event_id', sourceEventId)

        if (result.suppressed) suppressed += 1
        else sent += 1
        break
      }
    }

    logger.info('Template-lead sequence cron finished', { requestId, route: ROUTE, scanned: leads.length, eligible: eligible.length, sent, suppressed, failed })
    return jsonWithRequestId({ scanned: leads.length, eligible: eligible.length, sent, suppressed, failed, dryRun: false }, 200, requestId)
  } catch (error) {
    logger.error('Template-lead sequence cron top-level failure', {
      requestId,
      route: ROUTE,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
