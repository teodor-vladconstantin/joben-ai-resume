import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { isAuthorizedCronRequest, isDuplicateKeyError, parseCronOptions } from '@/lib/cron-utils'
import { sendTransactionalEmail } from '@/lib/resend'
import { getUserLocale } from '@/lib/user-locale'
import { LEGAL_VERSION } from '@/lib/legal/versions'
import {
  buildLegalNoticeEmail,
  currentLegalChange,
  findLegalNoticeRecipients,
  LEGAL_NOTICE_BATCH,
} from '@/lib/legal-notice'

export const runtime = 'nodejs'
export const maxDuration = 60

// Emails every user once when the legal documents change (LEGAL_CHANGELOG in
// src/lib/legal/versions.ts). Idempotent: the daily workflow can call it any
// number of times; it only sends to users without a legal_notice_deliveries row
// for the current version. It is a contract notice, so it is sent even to
// addresses on the marketing suppression list (sendTransactionalEmail).
export async function POST(request: Request) {
  const requestId = getRequestId(request)

  if (!isAuthorizedCronRequest(request)) {
    logger.warn('Legal change notice request rejected', { requestId, route: '/api/cron/legal-change-notice' })
    return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
  }

  const change = currentLegalChange()
  if (!change.notify) {
    return jsonWithRequestId({ version: LEGAL_VERSION, skipped: 'notify is false for this version' }, 200, requestId)
  }

  const options = parseCronOptions(request)

  try {
    const recipients = await findLegalNoticeRecipients(LEGAL_VERSION)
    if (options.dryRun) {
      return jsonWithRequestId({ version: LEGAL_VERSION, dryRun: true, candidates: recipients.length }, 200, requestId)
    }

    const batch = recipients.slice(0, Math.min(LEGAL_NOTICE_BATCH, options.limit))
    const supabase = createServerClient()
    let sent = 0
    let failed = 0

    for (const recipient of batch) {
      const locale = await getUserLocale(recipient.clerk_id)
      const email = buildLegalNoticeEmail(locale, change)
      const result = await sendTransactionalEmail({ to: recipient.email, subject: email.subject, body: email.body })
      if (!result.success) {
        failed += 1
        logger.error('Legal change notice email failed', { requestId, route: '/api/cron/legal-change-notice', userId: recipient.clerk_id, error: result.error })
        continue
      }
      const { error } = await supabase.from('legal_notice_deliveries').insert({ version: LEGAL_VERSION, user_clerk_id: recipient.clerk_id })
      if (error && !isDuplicateKeyError(error)) {
        logger.error('Legal change notice delivery record failed', { requestId, route: '/api/cron/legal-change-notice', userId: recipient.clerk_id, error: error.message })
      }
      sent += 1
    }

    return jsonWithRequestId(
      { version: LEGAL_VERSION, candidates: recipients.length, sent, failed, remaining: Math.max(0, recipients.length - sent) },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Legal change notice failed', { requestId, route: '/api/cron/legal-change-notice', error: error instanceof Error ? error.message : 'Unknown error' })
    return jsonWithRequestId({ error: 'Internal error' }, 500, requestId)
  }
}
