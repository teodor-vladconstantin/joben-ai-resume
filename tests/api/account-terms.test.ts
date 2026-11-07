import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LEGAL_VERSION } from '@/lib/legal/versions'

const authMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({ auth: authMock }))
vi.mock('@/lib/supabase/server', () => ({ createServerClient: createServerClientMock }))

type Row = { table: string; payload: Record<string, unknown> }

function mockClient(userRow: { tos_version: string | null } | null) {
  const inserts: Row[] = []
  const updates: Row[] = []
  const client = {
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn().mockResolvedValue({ data: userRow, error: null }) })),
      })),
      update: vi.fn((payload: Record<string, unknown>) => ({
        eq: vi.fn(() => {
          updates.push({ table, payload })
          return Promise.resolve({ error: null })
        }),
      })),
      insert: vi.fn((payload: Record<string, unknown>) => {
        inserts.push({ table, payload })
        return Promise.resolve({ error: null })
      }),
    })),
  }
  createServerClientMock.mockReturnValue(client)
  return { inserts, updates }
}

describe('/api/account/terms', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
  })

  it('rejects signed-out requests', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { GET, POST } = await import('@/app/api/account/terms/route')
    expect((await GET(new Request('http://localhost/api/account/terms'))).status).toBe(401)
    expect((await POST(new Request('http://localhost/api/account/terms', { method: 'POST' }))).status).toBe(401)
  })

  it('asks for re-acceptance when the stored version is old or missing', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    for (const stored of [null, '2026-01-01']) {
      mockClient({ tos_version: stored })
      const { GET } = await import('@/app/api/account/terms/route')
      const body = await (await GET(new Request('http://localhost/api/account/terms'))).json()
      expect(body.needsAcceptance).toBe(true)
    }
  })

  it('does not interrupt a user who accepted the current version or has no row yet', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    for (const row of [{ tos_version: LEGAL_VERSION }, null]) {
      mockClient(row)
      const { GET } = await import('@/app/api/account/terms/route')
      const body = await (await GET(new Request('http://localhost/api/account/terms'))).json()
      expect(body.needsAcceptance).toBe(false)
    }
  })

  it('records the acceptance on the user and in the history table with an IP hash', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    const { inserts, updates } = mockClient({ tos_version: '2026-01-01' })
    const { POST } = await import('@/app/api/account/terms/route')
    const res = await POST(new Request('http://localhost/api/account/terms', { method: 'POST', headers: { 'x-forwarded-for': '203.0.113.9' } }))
    expect(res.status).toBe(200)
    expect(updates[0]).toMatchObject({ table: 'users', payload: { tos_version: LEGAL_VERSION } })
    const history = inserts.find((r) => r.table === 'legal_acceptances')
    expect(history?.payload).toMatchObject({ user_clerk_id: 'user_1', doc_version: LEGAL_VERSION, source: 'reacceptance' })
    expect(history?.payload.ip_hash).toMatch(/^[0-9a-f]{16}$/)
    expect(JSON.stringify(history?.payload)).not.toContain('203.0.113.9')
  })
})
