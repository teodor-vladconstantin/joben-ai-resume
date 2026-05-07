import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createServerClientMock = vi.fn()
const checkFeatureLimitMock = vi.fn()
const incrementFeatureCounterMock = vi.fn()
const recordLimitHitMock = vi.fn()
const getMonthlyResetAtIsoMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('@/lib/ratelimit', () => ({
  checkFeatureLimit: checkFeatureLimitMock,
  incrementFeatureCounter: incrementFeatureCounterMock,
  recordLimitHit: recordLimitHitMock,
  getMonthlyResetAtIso: getMonthlyResetAtIsoMock,
}))

describe('CRUD smoke tests for resumes and cover letters APIs', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
    checkFeatureLimitMock.mockReset()
    incrementFeatureCounterMock.mockReset()
    recordLimitHitMock.mockReset()
    getMonthlyResetAtIsoMock.mockReset()

    checkFeatureLimitMock.mockResolvedValue({
      allowed: true,
      used: 0,
      limit: 1,
      blocked: false,
    })
    getMonthlyResetAtIsoMock.mockReturnValue('2026-05-01T00:00:00Z')
  })

  it('creates a resume successfully', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })

    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { plan: 'free' },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'resumes') {
          return {
            select: vi.fn((_columns: string, options?: { head?: boolean }) => {
              if (options?.head) {
                return {
                  eq: vi.fn().mockResolvedValue({
                    count: 2,
                    error: null,
                  }),
                }
              }

              return {
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }
            }),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'resume_1',
                    title: 'Untitled Resume',
                    updated_at: new Date().toISOString(),
                    score: 0,
                    data: {},
                  },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'product_events') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          }
        }

        return {
          select: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    })

    const { POST } = await import('@/app/api/resumes/route')
    const response = await POST(
      new Request('http://localhost/api/resumes', {
        method: 'POST',
        body: JSON.stringify({ title: 'My Resume', data: { personal: {} } }),
      })
    )

    const payload = (await response.json()) as { resume?: { id?: string } }
    expect(response.status).toBe(201)
    expect(payload.resume?.id).toBe('resume_1')
  })

  it('blocks resume creation when cv feature limit is reached', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    checkFeatureLimitMock.mockResolvedValueOnce({
      allowed: false,
      used: 1,
      limit: 1,
      blocked: false,
    })

    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { plan: 'free' },
                  error: null,
                }),
              })),
            })),
          }
        }

        if (table === 'resumes') {
          return {
            select: vi.fn((_columns: string, options?: { head?: boolean }) => {
              if (options?.head) {
                return {
                  eq: vi.fn().mockResolvedValue({
                    count: 3,
                    error: null,
                  }),
                }
              }

              return {
                eq: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }
            }),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({ data: null, error: null }),
              })),
            })),
          }
        }

        return {
          select: vi.fn().mockResolvedValue({ data: null, error: null }),
        }
      }),
    })

    const { POST } = await import('@/app/api/resumes/route')
    const response = await POST(
      new Request('http://localhost/api/resumes', {
        method: 'POST',
        body: JSON.stringify({ title: 'Blocked Resume', data: { personal: {} } }),
      })
    )

    const payload = (await response.json()) as {
      success?: boolean
      error?: string
      showUpgrade?: boolean
      limit?: number
      used?: number
    }

    // Plan-quota refusals return 403 (the request was authenticated but the
    // plan does not allow the action). The shared error envelope keeps
    // upgrade-related metadata so the client can render the upgrade modal.
    expect(response.status).toBe(403)
    expect(payload.success).toBe(false)
    expect(payload.error).toContain('Free plan allows up to 3')
    expect(payload.showUpgrade).toBe(true)
    expect(payload.limit).toBe(3)
    expect(payload.used).toBe(3)
  })

  it('returns 400 when deleting resume without id', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    const { DELETE } = await import('@/app/api/resumes/route')

    const response = await DELETE(
      new Request('http://localhost/api/resumes', {
        method: 'DELETE',
      })
    )

    expect(response.status).toBe(400)
  })

  it('creates a cover letter successfully', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })

    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'letter_1',
                title: 'Untitled Cover Letter',
                updated_at: new Date().toISOString(),
                content: '',
              },
              error: null,
            }),
          })),
        })),
      })),
    })

    const { POST } = await import('@/app/api/cover-letters/route')
    const response = await POST(
      new Request('http://localhost/api/cover-letters', {
        method: 'POST',
        body: JSON.stringify({ title: 'CL', content: 'Body' }),
      })
    )

    const payload = (await response.json()) as { letter?: { id?: string } }
    expect(response.status).toBe(201)
    expect(payload.letter?.id).toBe('letter_1')
  })

  it('returns 401 on cover-letters GET when user is missing', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { GET } = await import('@/app/api/cover-letters/route')

    const response = await GET()
    expect(response.status).toBe(401)
  })
})
