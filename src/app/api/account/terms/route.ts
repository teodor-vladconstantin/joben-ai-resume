import { auth } from '@clerk/nextjs/server'

import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'
import { LEGAL_VERSION } from '@/lib/legal/versions'

export const runtime = 'nodejs'

// GET: does the signed-in user still need to accept the current legal version?
export async function GET(req: Request) {
  const requestId = getRequestId(req)
  const { userId } = await auth()
  if (!userId) return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)

  const { data, error } = await createServerClient()
    .from('users')
    .select('tos_version')
    .eq('clerk_id', userId)
    .maybeSingle()
  if (error) {
    logger.error('Terms status lookup failed', { requestId, route: '/api/account/terms', error: error.message })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
  // No users row yet (webhook still running): do not interrupt the user.
  const needsAcceptance = Boolean(data) && data?.tos_version !== LEGAL_VERSION
  return jsonWithRequestId({ needsAcceptance, version: LEGAL_VERSION }, 200, requestId)
}

// POST: record acceptance of the current version (latest on users, history in legal_acceptances).
export async function POST(req: Request) {
  const requestId = getRequestId(req)
  const { userId } = await auth()
  if (!userId) return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)

  const identity = resolveRateLimitIdentity(req)
  const ipHash = identity.startsWith('ip:') ? identity.slice(3) : null
  const now = new Date().toISOString()
  const supabase = createServerClient()

  const { error } = await supabase
    .from('users')
    .update({ tos_accepted_at: now, tos_version: LEGAL_VERSION })
    .eq('clerk_id', userId)
  if (error) {
    logger.error('Terms acceptance update failed', { requestId, route: '/api/account/terms', error: error.message })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }

  const { error: historyError } = await supabase.from('legal_acceptances').insert({
    user_clerk_id: userId,
    doc_version: LEGAL_VERSION,
    source: 'reacceptance',
    ip_hash: ipHash,
    accepted_at: now,
  })
  if (historyError) {
    logger.error('Terms acceptance history insert failed', { requestId, route: '/api/account/terms', error: historyError.message })
  }

  return jsonWithRequestId({ ok: true, version: LEGAL_VERSION }, 200, requestId)
}
