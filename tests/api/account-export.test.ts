import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

function mockTable(data: unknown[] | Record<string, unknown> | null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => (Array.isArray(data) ? Promise.resolve({ data, error: null }) : {
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      })),
    })),
  }
}

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { GET } = await import('@/app/api/account/export/route')

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns a downloadable JSON export on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'users') return mockTable({ clerk_id: 'user_123', email: 'a@example.com' })
        return mockTable([])
      }),
    })

    const { GET } = await import('@/app/api/account/export/route')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    const body = await response.json()
    expect(body.account.email).toBe('a@example.com')
    expect(body.format).toBe('joben-gdpr-export-v1')
  })
})
