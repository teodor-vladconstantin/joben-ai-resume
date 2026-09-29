import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ATS_SCAN_PENDING_WINDOW_MS, selectAtsScanCardState } from '@/lib/ats-scan-card'

// Supabase stand-in: records filters, resolves maybeSingle() from `next`.
const calls: Array<[string, unknown[]]> = []
let next: { data: unknown; error: unknown } = { data: null, error: null }

function builder() {
  const chain: Record<string, (...args: unknown[]) => unknown> = {}
  for (const method of ['from', 'select', 'eq', 'order', 'limit']) {
    chain[method] = (...args: unknown[]) => {
      calls.push([method, args])
      return chain
    }
  }
  chain.maybeSingle = async () => next
  return chain
}

vi.mock('@/lib/supabase/server', () => ({ createServerClient: () => builder() }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const SCAN = '11111111-2222-3333-4444-555555555555'
const ISSUES = [
  { issue: 'No metrics', explanation: 'Bullets have no numbers.' },
  { issue: 'Vague summary', explanation: 'Summary lists duties only.' },
]

describe('getLatestClaimedAtsScan', () => {
  beforeEach(() => {
    calls.length = 0
    next = { data: null, error: null }
  })

  it('returns null when the user has no claimed scan (card does not render)', async () => {
    const { getLatestClaimedAtsScan } = await import('@/lib/actions/db')
    expect(await getLatestClaimedAtsScan('user_1')).toBeNull()
    expect(calls).toContainEqual(['eq', ['claimed_by', 'user_1']])
  })

  it('returns the score and the issues of the latest claimed scan', async () => {
    const { getLatestClaimedAtsScan } = await import('@/lib/actions/db')
    next = { data: { id: SCAN, overall_score: 58, report_json: { overall_score: 58, issues: ISSUES } }, error: null }

    const scan = await getLatestClaimedAtsScan('user_1')

    expect(scan).toEqual({ scanId: SCAN, score: 58, issues: ISSUES })
    expect(calls).toContainEqual(['order', ['created_at', { ascending: false }]])
  })

  it('drops malformed issues and returns null on a database error', async () => {
    const { getLatestClaimedAtsScan } = await import('@/lib/actions/db')
    next = { data: { id: SCAN, overall_score: 70, report_json: { issues: [ISSUES[0], { issue: 1 }, null] } }, error: null }
    expect((await getLatestClaimedAtsScan('user_1'))?.issues).toEqual([ISSUES[0]])

    next = { data: null, error: { message: 'column claimed_by does not exist' } }
    expect(await getLatestClaimedAtsScan('user_1')).toBeNull()
  })
})

describe('selectAtsScanCardState', () => {
  const now = 1_800_000_000_000

  it('claimed scan -> card with its score and issue count', () => {
    const state = selectAtsScanCardState({
      claimed: { scanId: SCAN, score: 58, issues: ISSUES },
      pendingScanId: SCAN,
      userCreatedAt: now,
      now,
    })
    expect(state.kind).toBe('card')
    if (state.kind === 'card') {
      expect(state.scan.score).toBe(58)
      expect(state.scan.issues).toHaveLength(2)
    }
  })

  it('no claimed scan, no scan id in sign-up metadata -> none', () => {
    expect(selectAtsScanCardState({ claimed: null, pendingScanId: null, userCreatedAt: now, now }).kind).toBe('none')
  })

  it('scan id in metadata on a fresh account -> pending; on an old account -> none', () => {
    expect(selectAtsScanCardState({ claimed: null, pendingScanId: SCAN, userCreatedAt: now - 5_000, now }).kind).toBe('pending')
    expect(
      selectAtsScanCardState({ claimed: null, pendingScanId: SCAN, userCreatedAt: now - ATS_SCAN_PENDING_WINDOW_MS, now }).kind
    ).toBe('none')
    expect(selectAtsScanCardState({ claimed: null, pendingScanId: SCAN, userCreatedAt: null, now }).kind).toBe('none')
  })
})
