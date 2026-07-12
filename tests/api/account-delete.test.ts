import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const clerkClientMock = vi.fn()
const createServerClientMock = vi.fn()
const stripeCancelMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function StripeMock() {
    return { subscriptions: { cancel: stripeCancelMock } }
  }),
}))

function mockSupabaseSuccess() {
  const deleteChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
  createServerClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_subscription_id: null }, error: null }),
        })),
      })),
      delete: vi.fn(() => deleteChain),
    })),
  })
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    clerkClientMock.mockReset()
    createServerClientMock.mockReset()
    stripeCancelMock.mockReset()
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/account/delete/route')

    const response = await POST()
    expect(response.status).toBe(401)
  })

  it('deletes all owned rows and the Clerk user on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabaseSuccess()
    const deleteUserMock = vi.fn().mockResolvedValue({})
    clerkClientMock.mockResolvedValue({ users: { deleteUser: deleteUserMock } })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean; data?: { deleted: boolean } }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data?.deleted).toBe(true)
    expect(deleteUserMock).toHaveBeenCalledWith('user_123')
  })

  it('still deletes Supabase data even if Clerk deletion fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabaseSuccess()
    clerkClientMock.mockResolvedValue({
      users: { deleteUser: vi.fn().mockRejectedValue(new Error('clerk down')) },
    })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
  })
})
