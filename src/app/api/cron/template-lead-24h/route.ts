import { createServerClient } from '@/lib/supabase/server'
import { sendTemplate24hEmail, toAnonScanEmailLocale } from '@/lib/resend'
import { TEMPLATE_24H_LAUNCH_AT } from '@/lib/template-sequence-copy'
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

const ROUTE = '/api/cron/template-lead-24h'
const DAY_MS = 24 * 60 * 60 * 1000
// A cron paused longer than this drops those leads instead of mailing them late.
const MAX_AGE_DAYS = 7
// ponytail: one page of leads per run; paginate if a week of leads ever passes 1000.
const PAGE = 1000
// Keeps the PostgREST `in` filters inside URL length limits.
const CHUNK = 100

type Lead = {
  id: string
  email: string
  locale: string | null
  posthog_distinct_id: string | null
}

const LEAD_COLUMNS = 'id, email, locale, posthog_distinct_id'

type Supabase = ReturnType<typeof createServerClient>

// Values of `column` that exist in `table` for any of `values`. Throws on a
// query error: an unknown state must never turn into a sent email.
async function findExisting(
  supabase: Supabase,
  table: 'users' | 'anonymous_scans' | 'email_suppressions' | 'email_events',
  column: 'email' | 'posthog_distinct_id',
  values: string[]
): Promise<Set<string>> {
  const found = new Set<string>()
  for (let i = 0; i < values.length; i += CHUNK) {
    let query = supabase.from(table).select(column).in(column, values.slice(i, i + CHUNK))
    // Any template email counts (the older series too); failed sends are retried.
    if (table === 'email_events') {
      query = query.like('email_type', 'template%').in('status', ['processing', 'sent', 'suppressed'])
    }
    const { data, error } = await query
    if (error) throw new Error(`${table} lookup failed: ${error.message}`)
    for (const row of (data || []) as unknown as Record<string, string | null>[]) {
      const value = row[column]
      if (value) found.add(value)
    }
  }
  return found
}

async function classify(supabase: Supabase, leads: Lead[]) {
  const emails = [...new Set(leads.map((lead) => lead.email))]
  const browserIds = [...new Set(leads.flatMap((lead) => (lead.posthog_distinct_id ? [lead.posthog_distinct_id] : [])))]
  const [accounts, scannedEmails, scannedBrowsers, suppressed, emailed] = await Promise.all([
    findExisting(supabase, 'users', 'email', emails),
    findExisting(supabase, 'anonymous_scans', 'email', emails),
    findExisting(supabase, 'anonymous_scans', 'posthog_distinct_id', browserIds),
    findExisting(supabase, 'email_suppressions', 'email', emails),
    findExisting(supabase, 'email_events', 'email', emails),
  ])

  const skipped = { account: 0, scanned: 0, suppressed: 0, disposable: 0 }
  const eligible = leads.filter((lead) => {
    if (accounts.has(lead.email)) skipped.account += 1
    else if (scannedEmails.has(lead.email) || scannedBrowsers.has(lead.posthog_distinct_id ?? '')) skipped.scanned += 1
    else if (suppressed.has(lead.email)) skipped.suppressed += 1
    else if (isDisposableEmailDomain(lead.email)) skipped.disposable += 1
    else return true
    return false
  })

  return { eligible, skipped, emailed }
}

// One email per lead, 24h after a template download with marketing consent,
// for leads captured since TEMPLATE_24H_LAUNCH_AT. `?dryRun=true` only counts,
// including the older leads that this route never mails.
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
      .select(LEAD_COLUMNS)
      .eq('marketing_consent', true)
      .gte('created_at', TEMPLATE_24H_LAUNCH_AT)
      .lte('email_confirmed_at', new Date(now - DAY_MS).toISOString())
      .gte('email_confirmed_at', new Date(now - MAX_AGE_DAYS * DAY_MS).toISOString())
      .order('email_confirmed_at', { ascending: true })
      .limit(PAGE)
    if (error) throw new Error(`template_leads lookup failed: ${error.message}`)

    const leads = (data || []) as Lead[]
    const { eligible, skipped, emailed } = await classify(supabase, leads)
    const due = eligible.filter((lead) => !emailed.has(lead.email))
    const summary = {
      scanned: leads.length,
      eligible: due.length,
      skipped: { ...skipped, alreadyEmailed: eligible.length - due.length },
    }

    if (options.dryRun) {
      const { data: oldData, error: oldError } = await supabase
        .from('template_leads')
        .select(LEAD_COLUMNS)
        .eq('marketing_consent', true)
        .lt('created_at', TEMPLATE_24H_LAUNCH_AT)
        .limit(PAGE)
      if (oldError) throw new Error(`template_leads backlog lookup failed: ${oldError.message}`)
      const old = (oldData || []) as Lead[]
      const backlog = await classify(supabase, old)
      return jsonWithRequestId(
        {
          dryRun: true,
          ...summary,
          backlog: {
            scanned: old.length,
            eligible: backlog.eligible.length,
            eligibleNeverEmailed: backlog.eligible.filter((lead) => !backlog.emailed.has(lead.email)).length,
            skipped: backlog.skipped,
          },
        },
        200,
        requestId
      )
    }

    let sent = 0
    let suppressed = 0
    let failed = 0

    for (const lead of due.slice(0, options.limit)) {
      const sourceEventId = `template-24h:${lead.id}`
      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: `lead:${lead.id}`,
        email: lead.email,
        email_type: 'template_24h',
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: 'cron.template-lead-24h' },
      })

      if (lockError) {
        if (isDuplicateKeyError(lockError)) continue
        failed += 1
        logger.error('Failed to claim template-lead 24h lock', { requestId, route: ROUTE, leadId: lead.id, error: lockError.message })
        continue
      }

      const result = await sendEmailWithRetry(
        ({ to }) => sendTemplate24hEmail({ to, locale: toAnonScanEmailLocale(lead.locale) }),
        { to: lead.email, firstName: null, maxRetries: options.maxRetries }
      )

      if (!result.success) {
        failed += 1
        logger.error('Template-lead 24h email failed', { requestId, route: ROUTE, leadId: lead.id, error: result.error })
        // Releasing the lock lets the next run retry.
        await supabase
          .from('email_events')
          .update({ status: 'failed', error: result.error, source_event_id: null })
          .eq('source_event_id', sourceEventId)
        continue
      }

      await supabase
        .from('email_events')
        .update({ status: result.suppressed ? 'suppressed' : 'sent', provider_id: result.providerId || null, error: null })
        .eq('source_event_id', sourceEventId)

      if (result.suppressed) suppressed += 1
      else sent += 1
    }

    logger.info('Template-lead 24h cron finished', {
      requestId,
      route: ROUTE,
      scanned: summary.scanned,
      eligible: summary.eligible,
      sent,
      suppressed,
      failed,
    })
    return jsonWithRequestId({ dryRun: false, ...summary, sent, suppressed, failed }, 200, requestId)
  } catch (error) {
    logger.error('Template-lead 24h cron top-level failure', {
      requestId,
      route: ROUTE,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export const GET = POST
