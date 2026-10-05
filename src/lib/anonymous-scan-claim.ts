import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

type ClaimInput = {
  userId: string
  scanId: string | null
  email: string | null
  emailVerified: boolean
}

// analyticsDistinctId: the scan's posthog_distinct_id, set only if the
// visitor accepted analytics cookies when scanning (else null).
export type ClaimResult = {
  scanId: string
  by: 'scan_id' | 'email'
  analyticsDistinctId: string | null
} | null

type ClaimedRow = { id: string; posthog_distinct_id: string | null } | null

// Links an anonymous ATS scan to a newly created account (Clerk webhook,
// user.created). Scan id first: it came through the sign-up link, and scan
// ids are unguessable, but an address-bound scan also needs a matching
// verified email. Otherwise the newest unclaimed scan with the same
// email, only when Clerk verified that email, so nobody can read someone
// else's scan by signing up with their address. `claimed_by is null` makes
// both paths first-claim-wins. Never throws: a failed claim must not fail
// the signup webhook.
export async function claimAnonymousScan(input: ClaimInput): Promise<ClaimResult> {
  try {
    const supabase = createServerClient()
    const claimedAt = new Date().toISOString()

    if (input.scanId) {
      // SECURITY: holding a scan id is not enough to take a scan that has an
      // address attached. It must have no address, or the same one this
      // account has verified. (Emails with filter-syntax characters are never
      // interpolated into the PostgREST filter.)
      const verifiedEmail =
        input.emailVerified && input.email && /^[^s,()"]+$/.test(input.email) ? input.email : null

      const base = supabase
        .from('anonymous_scans')
        .update({ claimed_by: input.userId, claimed_at: claimedAt })
        .eq('id', input.scanId)
        .is('claimed_by', null)
      const restricted = verifiedEmail
        ? base.or(`email.is.null,email.eq.${verifiedEmail}`)
        : base.is('email', null)

      const { data, error } = await restricted.select('id, posthog_distinct_id').maybeSingle()

      if (error) throw new Error(error.message)
      const row = data as ClaimedRow
      if (row?.id) return { scanId: row.id, by: 'scan_id', analyticsDistinctId: row.posthog_distinct_id ?? null }
    }

    if (!input.email || !input.emailVerified) return null

    const { data: latest, error: findError } = await supabase
      .from('anonymous_scans')
      .select('id')
      .eq('email', input.email)
      .is('claimed_by', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (findError) throw new Error(findError.message)
    if (!latest?.id) return null

    const { data: claimed, error: claimError } = await supabase
      .from('anonymous_scans')
      .update({ claimed_by: input.userId, claimed_at: claimedAt })
      .eq('id', latest.id)
      .is('claimed_by', null)
      .select('id, posthog_distinct_id')
      .maybeSingle()

    if (claimError) throw new Error(claimError.message)
    const row = claimed as ClaimedRow
    return row?.id ? { scanId: row.id, by: 'email', analyticsDistinctId: row.posthog_distinct_id ?? null } : null
  } catch (error) {
    logger.warn('Anonymous scan claim failed', {
      source: 'claimAnonymousScan',
      userId: input.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}
