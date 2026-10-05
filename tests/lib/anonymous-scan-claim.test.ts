import { beforeEach, describe, expect, it, vi } from 'vitest'

// Minimal chainable stand-in for the Supabase query builder: records every
// call and resolves maybeSingle() from a queue of canned results.
const calls: Array<[string, unknown[]]> = []
const results: Array<{ data: unknown; error: unknown }> = []

function builder() {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  for (const method of ['from', 'update', 'select', 'eq', 'is', 'or', 'order', 'limit']) {
    chain[method] = (...args: unknown[]) => {
      calls.push([method, args])
      return chain
    }
  }
  chain.maybeSingle = async () => results.shift() ?? { data: null, error: null }
  return chain
}

vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => builder() }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const SCAN = '11111111-2222-3333-4444-555555555555'

describe('claimAnonymousScan', () => {
  beforeEach(() => {
    calls.length = 0
    results.length = 0
  })

  it('claims by scan id first, only while unclaimed', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')
    results.push({ data: { id: SCAN, posthog_distinct_id: 'ph-browser-1' }, error: null })

    const claim = await claimAnonymousScan({ userId: 'user_1', scanId: SCAN, email: 'a@b.ro', emailVerified: true })

    // The stored browser id comes back so the webhook can alias it (consented scan).
    expect(claim).toEqual({ scanId: SCAN, by: 'scan_id', analyticsDistinctId: 'ph-browser-1' })
    expect(calls).toContainEqual(['eq', ['id', SCAN]])
    expect(calls).toContainEqual(['is', ['claimed_by', null]])
    // Address-bound scans need a matching verified email.
    expect(calls).toContainEqual(['or', ['email.is.null,email.eq.a@b.ro']])
  })

  it('only claims address-less scans by id when the email is unverified', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')
    results.push({ data: { id: SCAN, posthog_distinct_id: null }, error: null })

    await claimAnonymousScan({ userId: 'user_1', scanId: SCAN, email: 'a@b.ro', emailVerified: false })

    expect(calls).toContainEqual(['is', ['email', null]])
    expect(calls.some(([method]) => method === 'or')).toBe(false)
  })

  it('never claims by an unverified email', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')

    const claim = await claimAnonymousScan({ userId: 'user_1', scanId: null, email: 'a@b.ro', emailVerified: false })

    expect(claim).toBeNull()
    expect(calls).toHaveLength(0)
  })

  it('falls back to the newest unclaimed scan with the same verified email', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')
    results.push({ data: { id: SCAN }, error: null }, { data: { id: SCAN, posthog_distinct_id: null }, error: null })

    const claim = await claimAnonymousScan({ userId: 'user_1', scanId: null, email: 'a@b.ro', emailVerified: true })

    // Scan made without analytics consent: nothing to alias.
    expect(claim).toEqual({ scanId: SCAN, by: 'email', analyticsDistinctId: null })
    expect(calls).toContainEqual(['eq', ['email', 'a@b.ro']])
  })

  it('does not fall back to email when the scan id is already claimed and the email is unverified', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')
    results.push({ data: null, error: null })

    const claim = await claimAnonymousScan({ userId: 'user_2', scanId: SCAN, email: 'a@b.ro', emailVerified: false })

    expect(claim).toBeNull()
  })

  it('returns null instead of throwing when the database errors', async () => {
    const { claimAnonymousScan } = await import('@/lib/anonymous-scan-claim')
    results.push({ data: null, error: { message: 'column claimed_by does not exist' } })

    await expect(
      claimAnonymousScan({ userId: 'user_1', scanId: SCAN, email: null, emailVerified: false })
    ).resolves.toBeNull()
  })
})
