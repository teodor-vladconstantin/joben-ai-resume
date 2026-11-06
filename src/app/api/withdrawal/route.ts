import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { checkRouteRateLimit, resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { sendTransactionalEmail } from '@/lib/resend'
import { buildWithdrawalAcknowledgement, withdrawalSchema } from '@/lib/withdrawal'
import { company } from '@/lib/content'

export const runtime = 'nodejs'

const WITHDRAWAL_RATE_LIMIT_PER_HOUR = 10

// Right-of-withdrawal function (Directive 2011/83/EU art. 11a). Open to anyone,
// signed in or not, so a consumer can always reach it. The consumer receives an
// acknowledgement email with the content and time of the declaration, and the
// company inbox gets a copy, so a request is on record even if the table
// (migration 20261022120000) has not been applied yet.
export async function POST(req: Request) {
  const requestId = getRequestId(req)

  try {
    const { userId } = await auth()
    const identity = resolveRateLimitIdentity(req, userId)
    // Fails open: a Redis outage must never stop a consumer from withdrawing.
    const limit = await checkRouteRateLimit({
      name: 'withdrawal',
      identifier: identity,
      limit: WITHDRAWAL_RATE_LIMIT_PER_HOUR,
      windowSeconds: 3600,
      failClosed: false,
    })
    if (!limit.ok) {
      return jsonWithRequestId({ error: clientErrorMessage('rate_limit') }, 429, requestId)
    }

    const body: unknown = await req.json().catch(() => null)
    const parsed = withdrawalSchema.safeParse(body)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }
    const input = parsed.data
    const receivedAt = new Date()

    const ack = buildWithdrawalAcknowledgement(input, receivedAt)
    const consumerEmail = await sendTransactionalEmail({ to: input.email, ...ack })
    if (!consumerEmail.success) {
      logger.error('Withdrawal acknowledgement failed', { requestId, route: '/api/withdrawal', error: consumerEmail.error })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const notice = await sendTransactionalEmail({
      to: company.email,
      replyTo: input.email,
      subject: `Withdrawal statement from ${input.email}`,
      html: `<p>Withdrawal statement received ${receivedAt.toISOString()}.</p>
<ul><li>Name: ${input.name.replace(/</g, '&lt;')}</li><li>Email: ${input.email}</li><li>Contract: ${(input.contractRef ?? '-').replace(/</g, '&lt;')}</li><li>Account: ${userId ?? 'not signed in'}</li><li>Locale: ${input.locale}</li></ul>`,
    })
    if (!notice.success) {
      logger.error('Withdrawal company notice failed', { requestId, route: '/api/withdrawal', error: notice.error })
    }

    const ipHash = identity.startsWith('ip:') ? identity.slice(3) : null
    const { error } = await createServerClient().from('withdrawal_requests').insert({
      name: input.name,
      email: input.email,
      contract_ref: input.contractRef ?? null,
      user_clerk_id: userId ?? null,
      locale: input.locale,
      ip_hash: ipHash,
      ack_sent_at: receivedAt.toISOString(),
    })
    if (error) {
      logger.error('Withdrawal insert failed', { requestId, route: '/api/withdrawal', error: error.message })
    }

    return jsonWithRequestId({ ok: true, receivedAt: receivedAt.toISOString() }, 200, requestId)
  } catch (error) {
    logger.error('Withdrawal route failed', {
      requestId,
      route: '/api/withdrawal',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
