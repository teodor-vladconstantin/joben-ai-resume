import { beforeEach, describe, expect, it, vi } from 'vitest'

const { verifyMock, processReferralAttributionMock, createClientMock } = vi.hoisted(() => ({
  verifyMock: vi.fn(),
  processReferralAttributionMock: vi.fn(),
  createClientMock: vi.fn(),
}))

vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(function WebhookMock() {
    return { verify: verifyMock }
  }),
}))
vi.mock('next/headers', () => ({
  headers: async () => new Headers({ 'svix-id': 'msg_1', 'svix-timestamp': '1', 'svix-signature': 'sig' }),
}))
vi.mock('@clerk/nextjs/server', () => ({ clerkClient: vi.fn() }))
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }))
vi.mock('@/lib/referral', () => ({ processReferralAttribution: processReferralAttributionMock }))
vi.mock('@/lib/resend', () => ({ sendWelcomeEmail: vi.fn() }))
vi.mock('@/lib/posthog-server', () => ({ capturePostHogEvent: vi.fn(), aliasPostHogDistinctId: vi.fn() }))
vi.mock('@/lib/anonymous-scan-claim', () => ({ claimAnonymousScan: vi.fn() }))
vi.mock('@/app/api/account/delete/route', () => ({ OWNED_TABLES: [], OTHER_OWNED_TABLES: [] }))

const DAY_MS = 24 * 60 * 60 * 1000

function userUpdatedEvent(createdAt: number) {
  return {
    type: 'user.updated',
    data: {
      id: 'user_1',
      first_name: 'A',
      last_name: 'B',
      created_at: createdAt,
      primary_email_address_id: 'em_1',
      email_addresses: [{ id: 'em_1', email_address: 'a@gmail.com', verification: { status: 'verified' } }],
      unsafe_metadata: { ref: 'JOBEN-AAAA2222' },
    },
  }
}

describe('Clerk webhook user.updated referral attribution', () => {
  beforeEach(() => {
    vi.resetModules()
    verifyMock.mockReset()
    processReferralAttributionMock.mockReset().mockResolvedValue({ success: true })
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_dGVzdA=='
    const ok = Promise.resolve({ error: null })
    createClientMock.mockReturnValue({
      from: () => ({
        insert: () => ok,
        upsert: () => ok,
      }),
    })
  })

  async function post(createdAt: number) {
    const event = userUpdatedEvent(createdAt)
    verifyMock.mockReturnValue(event)
    const { POST } = await import('@/app/api/webhooks/clerk/route')
    return POST(new Request('http://localhost/api/webhooks/clerk', { method: 'POST', body: JSON.stringify(event) }))
  }

  it('attributes a referral for an account created within 7 days', async () => {
    const response = await post(Date.now() - DAY_MS)
    expect(response.status).toBe(200)
    expect(processReferralAttributionMock).toHaveBeenCalledWith({ newUserId: 'user_1', referralCode: 'JOBEN-AAAA2222' })
  })

  it('ignores unsafeMetadata.ref on an account older than 7 days', async () => {
    const response = await post(Date.now() - 30 * DAY_MS)
    expect(response.status).toBe(200)
    expect(processReferralAttributionMock).not.toHaveBeenCalled()
  })
})
