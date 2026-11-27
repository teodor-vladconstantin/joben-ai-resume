import { beforeEach, describe, expect, it, vi } from 'vitest'

type Lead = {
  id: string
  email: string
  locale: string
  posthog_distinct_id: string | null
  created_at: string
  email_confirmed_at: string
  marketing_consent: boolean
}
type Row = Record<string, unknown>

const state = vi.hoisted(() => ({
  tables: {} as Record<string, Record<string, unknown>[]>,
  sendMock: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  sendTemplate24hEmail: state.sendMock,
  toAnonScanEmailLocale: (v: string | null) => (v === 'en' ? 'en' : 'ro'),
}))

// A small in-memory PostgREST: enough of the filters for the route's queries,
// so a wrong date window or a missing filter fails here.
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      const filters: ((row: Row) => boolean)[] = []
      let limit = Infinity
      const text = (row: Row, column: string) => String(row[column])
      const chain = {
        select: () => chain,
        eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), chain),
        in: (c: string, v: unknown[]) => (filters.push((r) => v.includes(r[c])), chain),
        like: (c: string, v: string) => (filters.push((r) => text(r, c).startsWith(v.replace('%', ''))), chain),
        gte: (c: string, v: string) => (filters.push((r) => Date.parse(text(r, c)) >= Date.parse(v)), chain),
        lte: (c: string, v: string) => (filters.push((r) => Date.parse(text(r, c)) <= Date.parse(v)), chain),
        lt: (c: string, v: string) => (filters.push((r) => Date.parse(text(r, c)) < Date.parse(v)), chain),
        order: () => chain,
        limit: (n: number) => ((limit = n), chain),
        then: (resolve: (value: { data: Row[]; error: null }) => unknown) =>
          resolve({ data: (state.tables[table] ?? []).filter((r) => filters.every((f) => f(r))).slice(0, limit), error: null }),
        insert: (row: Row) => {
          const rows = (state.tables[table] ??= [])
          if (rows.some((r) => r.source_event_id === row.source_event_id)) {
            return Promise.resolve({ error: { code: '23505', message: 'dup' } })
          }
          rows.push({ ...row })
          return Promise.resolve({ error: null })
        },
        update: (patch: Row) => ({
          eq: (c: string, v: unknown) => {
            for (const r of state.tables[table] ?? []) if (r[c] === v) Object.assign(r, patch)
            return Promise.resolve({ error: null })
          },
        }),
      }
      return chain
    },
  }),
}))

import { POST } from '@/app/api/cron/template-lead-24h/route'
import { TEMPLATE_24H_LAUNCH_AT } from '@/lib/template-sequence-copy'

const HOUR = 60 * 60 * 1000
const NOW = Date.parse(TEMPLATE_24H_LAUNCH_AT) + 10 * 24 * HOUR

const lead = (id: string, ageHours = 25, extra: Partial<Lead> = {}): Lead => {
  const at = new Date(NOW - ageHours * HOUR).toISOString()
  return {
    id,
    email: `${id}@example.com`,
    locale: 'ro',
    posthog_distinct_id: null,
    created_at: at,
    email_confirmed_at: at,
    marketing_consent: true,
    ...extra,
  }
}

const run = async (query = '', auth = 'Bearer secret') => {
  const response = await POST(
    new Request(`http://localhost/api/cron/template-lead-24h${query}`, { method: 'POST', headers: { authorization: auth } })
  )
  return { status: response.status, body: await response.json() }
}

const recipients = () => state.sendMock.mock.calls.map((call) => call[0].to)

describe('POST /api/cron/template-lead-24h', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
    process.env.CRON_SECRET = 'secret'
    state.tables = {}
    state.sendMock.mockReset().mockResolvedValue({ success: true, providerId: 'p' })
  })

  it('rejects requests without the cron secret', async () => {
    expect((await run('', 'Bearer wrong')).status).toBe(401)
  })

  it('mails only consenting new leads between 24h and 7 days old, in their language', async () => {
    state.tables.template_leads = [
      lead('due', 25, { locale: 'en' }),
      lead('early', 23),
      lead('late', 8 * 24),
      lead('noconsent', 25, { marketing_consent: false }),
      lead('old', 25, { created_at: '2026-11-01T00:00:00Z' }),
    ]

    await run()

    expect(state.sendMock.mock.calls.map((c) => c[0])).toEqual([{ to: 'due@example.com', locale: 'en' }])
  })

  it('skips accounts, scans (by email or browser), unsubscribes and earlier template emails', async () => {
    state.tables.template_leads = [
      lead('account'),
      lead('scanmail'),
      lead('scanbrowser', 25, { posthog_distinct_id: 'ph-1' }),
      lead('unsub'),
      lead('series'),
      lead('ok'),
    ]
    state.tables.users = [{ email: 'account@example.com' }]
    state.tables.anonymous_scans = [{ email: 'scanmail@example.com' }, { posthog_distinct_id: 'ph-1' }]
    state.tables.email_suppressions = [{ email: 'unsub@example.com' }]
    state.tables.email_events = [{ email: 'series@example.com', email_type: 'template_seq_1', status: 'sent' }]

    const { body } = await run()

    expect(recipients()).toEqual(['ok@example.com'])
    expect(body.skipped).toEqual({ account: 1, scanned: 2, suppressed: 1, disposable: 0, alreadyEmailed: 1 })
  })

  it('sends one email per person across runs', async () => {
    state.tables.template_leads = [lead('a')]

    await run()
    await run()

    expect(state.sendMock).toHaveBeenCalledTimes(1)
  })

  it('retries a failed send on the next run', async () => {
    state.tables.template_leads = [lead('a')]
    state.sendMock.mockResolvedValueOnce({ success: false, error: 'down' }).mockResolvedValue({ success: true })

    await run('?retries=0')
    await run('?retries=0')

    expect(state.sendMock).toHaveBeenCalledTimes(2)
  })

  it('dry run sends nothing, writes nothing and counts the older leads', async () => {
    state.tables.template_leads = [
      lead('new'),
      lead('old1', 25, { created_at: '2026-11-01T00:00:00Z' }),
      lead('old2', 25, { created_at: '2026-11-01T00:00:00Z' }),
      lead('oldacc', 25, { created_at: '2026-11-01T00:00:00Z' }),
    ]
    state.tables.users = [{ email: 'oldacc@example.com' }]
    state.tables.email_events = [{ email: 'old1@example.com', email_type: 'template_seq_1', status: 'sent' }]

    const { body } = await run('?dryRun=true')

    expect(state.sendMock).not.toHaveBeenCalled()
    expect(state.tables.email_events).toHaveLength(1)
    expect(body).toMatchObject({ dryRun: true, eligible: 1, backlog: { scanned: 3, eligible: 2, eligibleNeverEmailed: 1 } })
  })
})
