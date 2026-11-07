import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LEGAL_CHANGELOG, LEGAL_VERSION } from '@/lib/legal/versions'

const createServerClientMock = vi.fn()
const sendTransactionalEmailMock = vi.fn()
const getUserLocaleMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({ createServerClient: createServerClientMock }))
vi.mock('@/lib/resend', () => ({ sendTransactionalEmail: sendTransactionalEmailMock }))
vi.mock('@/lib/user-locale', () => ({ getUserLocale: getUserLocaleMock }))

type User = { clerk_id: string; email: string | null; tos_version: string | null }

function mockDb(users: User[], deliveredIds: string[] = []) {
  const inserts: Record<string, unknown>[] = []
  createServerClientMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return { select: vi.fn(() => ({ not: vi.fn().mockResolvedValue({ data: users.filter((u) => u.email), error: null }) })) }
      }
      return {
        select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: deliveredIds.map((id) => ({ user_clerk_id: id })), error: null }) })),
        insert: vi.fn((row: Record<string, unknown>) => {
          inserts.push(row)
          return Promise.resolve({ error: null })
        }),
      }
    }),
  })
  return inserts
}

function cronRequest(query = '') {
  return new Request(`http://localhost/api/cron/legal-change-notice${query}`, {
    method: 'POST',
    headers: { authorization: 'Bearer test-cron-secret' },
  })
}

describe('legal changelog', () => {
  it('has a newest entry that defines LEGAL_VERSION, with matching RO and EN lists', () => {
    expect(LEGAL_VERSION).toBe(LEGAL_CHANGELOG[0].version)
    for (const change of LEGAL_CHANGELOG) {
      expect(change.version).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(change.ro.length).toBeGreaterThan(0)
      expect(change.ro).toHaveLength(change.en.length)
    }
    const versions = LEGAL_CHANGELOG.map((c) => c.version)
    expect([...versions].sort().reverse()).toEqual(versions)
  })
})

describe('POST /api/cron/legal-change-notice', () => {
  beforeEach(() => {
    vi.resetModules()
    process.env.CRON_SECRET = 'test-cron-secret'
    createServerClientMock.mockReset()
    sendTransactionalEmailMock.mockReset()
    getUserLocaleMock.mockReset()
    getUserLocaleMock.mockResolvedValue('en')
    sendTransactionalEmailMock.mockResolvedValue({ success: true })
  })

  it('rejects requests without the cron secret', async () => {
    const { POST } = await import('@/app/api/cron/legal-change-notice/route')
    const res = await POST(new Request('http://localhost/api/cron/legal-change-notice', { method: 'POST' }))
    expect(res.status).toBe(401)
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('emails only users on an older version who were not emailed yet, and records each delivery', async () => {
    const inserts = mockDb(
      [
        { clerk_id: 'u_old', email: 'old@example.com', tos_version: '2026-01-01' },
        { clerk_id: 'u_none', email: 'none@example.com', tos_version: null },
        { clerk_id: 'u_current', email: 'current@example.com', tos_version: LEGAL_VERSION },
        { clerk_id: 'u_done', email: 'done@example.com', tos_version: '2026-01-01' },
        { clerk_id: 'u_noemail', email: null, tos_version: null },
      ],
      ['u_done']
    )
    const { POST } = await import('@/app/api/cron/legal-change-notice/route')
    const body = await (await POST(cronRequest())).json()

    expect(body).toMatchObject({ version: LEGAL_VERSION, candidates: 2, sent: 2, failed: 0, remaining: 0 })
    const recipients = sendTransactionalEmailMock.mock.calls.map((c) => c[0].to).sort()
    expect(recipients).toEqual(['none@example.com', 'old@example.com'])
    expect(inserts.map((r) => r.user_clerk_id).sort()).toEqual(['u_none', 'u_old'])
    expect(inserts.every((r) => r.version === LEGAL_VERSION)).toBe(true)
  })

  it('dry run counts recipients and sends nothing', async () => {
    mockDb([{ clerk_id: 'u1', email: 'a@example.com', tos_version: null }])
    const { POST } = await import('@/app/api/cron/legal-change-notice/route')
    const body = await (await POST(cronRequest('?dryRun=true'))).json()
    expect(body).toMatchObject({ dryRun: true, candidates: 1 })
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled()
  })

  it('does not record a delivery when the email fails, so it is retried', async () => {
    const inserts = mockDb([{ clerk_id: 'u1', email: 'a@example.com', tos_version: null }])
    sendTransactionalEmailMock.mockResolvedValue({ success: false, error: 'boom' })
    const { POST } = await import('@/app/api/cron/legal-change-notice/route')
    const body = await (await POST(cronRequest())).json()
    expect(body).toMatchObject({ sent: 0, failed: 1, remaining: 1 })
    expect(inserts).toHaveLength(0)
  })
})
