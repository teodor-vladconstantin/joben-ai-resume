import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const currentUserMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  currentUser: currentUserMock,
}))

// Redis-backed limiter/lockout is fail-closed; these tests run without Redis.
vi.mock('@/lib/security/route-rate-limit', () => ({
  checkRouteRateLimit: async () => ({ ok: true, remaining: 5, resetAt: 0, retryAfter: 0 }),
  isLocked: async () => false,
  bumpCounter: async () => 0,
  setLock: async () => undefined,
  resolveRateLimitIdentity: () => 'u:test',
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

describe('redeem code API', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    currentUserMock.mockReset()
    createServerClientMock.mockReset()
    process.env.RECRUITING_LIFETIME_CODE = 'PRIVATE_TEST_REDEEM_CODE'
    delete process.env.LIFETIME_RECRUITING_CODE
    delete process.env.REDEEM_ACCESS_CODE
    delete process.env.REDEEM_CODE
  })

  it('returns 401 when user is missing', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'PRIVATE_TEST_REDEEM_CODE' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 400 for invalid code', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'WRONG' }),
      })
    )

    expect(response.status).toBe(400)
  })

  it('rejects a valid code once REDEEM_CODE_MAX_REDEMPTIONS is reached', async () => {
    process.env.REDEEM_CODE_MAX_REDEMPTIONS = '2'
    authMock.mockResolvedValue({ userId: 'user_123' })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })

    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn((_cols: string, opts?: { head?: boolean }) => ({
          eq: vi.fn(() =>
            opts?.head
              ? Promise.resolve({ count: 2, error: null })
              : { maybeSingle: vi.fn().mockResolvedValue({ data: { lifetime_recruiting_unlocked: false }, error: null }) }
          ),
        })),
        upsert: upsertMock,
      })),
    })

    const { POST } = await import('@/app/api/billing/redeem-code/route')
    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'private_test_redeem_code' }),
      })
    )
    delete process.env.REDEEM_CODE_MAX_REDEMPTIONS

    expect(response.status).toBe(400)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('activates recruiting lifetime for valid code', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    currentUserMock.mockResolvedValue({
      primaryEmailAddress: { emailAddress: 'user@example.com', verification: { status: 'verified' } },
    })

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { lifetime_recruiting_unlocked: false },
      error: null,
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })

    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleMock,
          })),
        })),
        upsert: upsertMock,
      })),
    })

    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'private_test_redeem_code' }),
      })
    )

    const payload = (await response.json()) as {
      success?: boolean
      plan?: string
      alreadyActive?: boolean
    }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.plan).toBe('recruiting')
    expect(payload.alreadyActive).toBe(false)
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        clerk_id: 'user_123',
        email: 'user@example.com',
        plan: 'recruiting',
        lifetime_recruiting_unlocked: true,
        lifetime_recruiting_code: 'private_recruiting_lifetime_code',
      }),
      { onConflict: 'clerk_id' }
    )
  })

  it('accepts legacy env alias keys when canonical key is absent', async () => {
    delete process.env.RECRUITING_LIFETIME_CODE
    process.env.LIFETIME_RECRUITING_CODE = 'PRIVATE_TEST_REDEEM_CODE'

    authMock.mockResolvedValue({ userId: 'user_legacy' })
    currentUserMock.mockResolvedValue({
      emailAddresses: [{ emailAddress: 'legacy@example.com' }],
    })

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: { lifetime_recruiting_unlocked: false },
      error: null,
    })
    const upsertMock = vi.fn().mockResolvedValue({ error: null })

    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: maybeSingleMock,
          })),
        })),
        upsert: upsertMock,
      })),
    })

    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'private_test_redeem_code' }),
      })
    )

    const payload = (await response.json()) as { success?: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(upsertMock).toHaveBeenCalled()
  })

  it('returns 500 when code env is placeholder-only', async () => {
    process.env.RECRUITING_LIFETIME_CODE = 'CHANGE_ME_PRIVATE_REDEEM_CODE'
    authMock.mockResolvedValue({ userId: 'user_123' })

    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'PRIVATE_TEST_REDEEM_CODE' }),
      })
    )

    expect(response.status).toBe(500)
  })

  it('is idempotent when recruiting lifetime already active', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })

    const upsertMock = vi.fn()
    createServerClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { lifetime_recruiting_unlocked: true },
              error: null,
            }),
          })),
        })),
        upsert: upsertMock,
      })),
    })

    const { POST } = await import('@/app/api/billing/redeem-code/route')

    const response = await POST(
      new Request('http://localhost/api/billing/redeem-code', {
        method: 'POST',
        body: JSON.stringify({ code: 'PRIVATE_TEST_REDEEM_CODE' }),
      })
    )

    const payload = (await response.json()) as {
      success?: boolean
      alreadyActive?: boolean
    }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.alreadyActive).toBe(true)
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
