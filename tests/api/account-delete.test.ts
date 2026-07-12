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

interface DeleteCall {
  table: string
  column: string
  value: unknown
}

interface MockSupabaseOptions {
  stripeSubscriptionId?: string | null
  /** Table whose `.delete().eq()` call should resolve with an error. */
  deleteErrorTable?: string
}

/**
 * Builds a table-aware Supabase mock. Every `.from(table)` call is recorded,
 * and every `.delete().eq(column, value)` call is pushed onto `deleteCalls`
 * so tests can assert exactly which table/column/value combinations the
 * route touched (rather than a single undifferentiated stub that would pass
 * even if the route queried the wrong table or column).
 */
function mockSupabase(options: MockSupabaseOptions = {}) {
  const { stripeSubscriptionId = null, deleteErrorTable } = options
  const deleteCalls: DeleteCall[] = []

  const fromMock = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { stripe_subscription_id: stripeSubscriptionId },
          error: null,
        }),
      })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn((column: string, value: unknown) => {
        deleteCalls.push({ table, column, value })
        const error = table === deleteErrorTable ? { message: `${table} delete failed` } : null
        return Promise.resolve({ error })
      }),
    })),
  }))

  createServerClientMock.mockReturnValue({ from: fromMock })

  return { deleteCalls, fromMock }
}

const EXPECTED_DELETE_CALLS: Array<{ table: string; column: string }> = [
  { table: 'resume_analyses', column: 'user_id' },
  { table: 'ai_reviews', column: 'user_id' },
  { table: 'resumes', column: 'user_id' },
  { table: 'cover_letters', column: 'user_id' },
  { table: 'feedback', column: 'user_id' },
  { table: 'email_events', column: 'user_clerk_id' },
  { table: 'users', column: 'clerk_id' },
]

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
    const { deleteCalls } = mockSupabase()
    const deleteUserMock = vi.fn().mockResolvedValue({})
    clerkClientMock.mockResolvedValue({ users: { deleteUser: deleteUserMock } })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean; data?: { deleted: boolean } }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data?.deleted).toBe(true)
    expect(deleteUserMock).toHaveBeenCalledWith('user_123')

    for (const expected of EXPECTED_DELETE_CALLS) {
      expect(deleteCalls).toContainEqual({
        table: expected.table,
        column: expected.column,
        value: 'user_123',
      })
    }
    expect(deleteCalls).toHaveLength(EXPECTED_DELETE_CALLS.length)
  })

  it('still deletes Supabase data even if Clerk deletion fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabase()
    clerkClientMock.mockResolvedValue({
      users: { deleteUser: vi.fn().mockRejectedValue(new Error('clerk down')) },
    })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
  })

  it('cancels the Stripe subscription when the user has one', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabase({ stripeSubscriptionId: 'sub_abc123' })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })
    stripeCancelMock.mockResolvedValue({})

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(stripeCancelMock).toHaveBeenCalledWith('sub_abc123')
  })

  it('does not call Stripe cancel when the user has no subscription', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabase({ stripeSubscriptionId: null })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })

    const { POST } = await import('@/app/api/account/delete/route')
    await POST()

    expect(stripeCancelMock).not.toHaveBeenCalled()
  })

  it('still deletes data and returns success when Stripe cancel fails (e.g. already canceled)', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    const { deleteCalls } = mockSupabase({ stripeSubscriptionId: 'sub_abc123' })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })
    stripeCancelMock.mockRejectedValue(new Error('No such subscription'))

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean; data?: { deleted: boolean } }

    expect(stripeCancelMock).toHaveBeenCalledWith('sub_abc123')
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data?.deleted).toBe(true)
    // Deletion must still proceed despite the Stripe failure.
    expect(deleteCalls.length).toBe(EXPECTED_DELETE_CALLS.length)
  })
})
