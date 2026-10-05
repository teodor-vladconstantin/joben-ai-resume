import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const clerkClientMock = vi.fn()
const createServerClientMock = vi.fn()
const stripeCancelMock = vi.fn()

const reverificationErrorResponseMock = vi.fn(
  () => new Response(JSON.stringify({ clerk_error: { type: 'forbidden', reason: 'reverification-error' } }), { status: 403 })
)

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
  reverificationErrorResponse: reverificationErrorResponseMock,
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
  { table: 'product_events', column: 'user_clerk_id' },
  { table: 'anonymous_scans', column: 'claimed_by' },
  { table: 'users', column: 'clerk_id' },
]

function deleteRequest(body: unknown = { confirm: true }) {
  return new Request('http://localhost/api/account/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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

    const response = await POST(deleteRequest())
    expect(response.status).toBe(401)
  })

  it('deletes all owned rows and the Clerk user on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    const { deleteCalls } = mockSupabase()
    const deleteUserMock = vi.fn().mockResolvedValue({})
    clerkClientMock.mockResolvedValue({ users: { deleteUser: deleteUserMock } })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())
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
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    mockSupabase()
    clerkClientMock.mockResolvedValue({
      users: { deleteUser: vi.fn().mockRejectedValue(new Error('clerk down')) },
    })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
  })

  it('cancels the Stripe subscription when the user has one', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    mockSupabase({ stripeSubscriptionId: 'sub_abc123' })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })
    stripeCancelMock.mockResolvedValue({})

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(stripeCancelMock).toHaveBeenCalledWith('sub_abc123')
  })

  it('does not call Stripe cancel when the user has no subscription', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    mockSupabase({ stripeSubscriptionId: null })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })

    const { POST } = await import('@/app/api/account/delete/route')
    await POST(deleteRequest())

    expect(stripeCancelMock).not.toHaveBeenCalled()
  })

  it('still deletes data and returns success when Stripe cancel fails (e.g. already canceled)', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    const { deleteCalls } = mockSupabase({ stripeSubscriptionId: 'sub_abc123' })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })
    stripeCancelMock.mockRejectedValue(Object.assign(new Error('No such subscription'), { code: 'resource_missing' }))

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())
    const payload = (await response.json()) as { success: boolean; data?: { deleted: boolean } }

    expect(stripeCancelMock).toHaveBeenCalledWith('sub_abc123')
    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data?.deleted).toBe(true)
    // Deletion must still proceed despite the Stripe failure.
    expect(deleteCalls.length).toBe(EXPECTED_DELETE_CALLS.length)
  })

  it('aborts without deleting anything when Stripe cancel fails for another reason', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    const { deleteCalls } = mockSupabase({ stripeSubscriptionId: 'sub_abc123' })
    clerkClientMock.mockResolvedValue({ users: { deleteUser: vi.fn().mockResolvedValue({}) } })
    stripeCancelMock.mockRejectedValue(new Error('Stripe API unreachable'))

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())

    expect(response.status).toBe(502)
    expect(deleteCalls).toHaveLength(0)
  })

  it('rejects a request without the explicit confirmation body', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => true })
    const { deleteCalls } = mockSupabase()

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(new Request('http://localhost/api/account/delete', { method: 'POST' }))

    expect(response.status).toBe(400)
    expect(deleteCalls).toHaveLength(0)
  })

  it('asks for re-verification and deletes nothing when the session is not freshly verified', async () => {
    authMock.mockResolvedValue({ userId: 'user_123', has: () => false })
    const { deleteCalls } = mockSupabase()

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST(deleteRequest())

    expect(response.status).toBe(403)
    expect(reverificationErrorResponseMock).toHaveBeenCalledWith('strict')
    expect(deleteCalls).toHaveLength(0)
  })
})
