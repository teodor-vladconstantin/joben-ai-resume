import { describe, expect, it, vi } from 'vitest'

const { authMock, getUserReferralInfoMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getUserReferralInfoMock: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: authMock }))
vi.mock('@/lib/referral', () => ({ getUserReferralInfo: getUserReferralInfoMock }))

import { GET } from '@/app/api/referral/route'

describe('GET /api/referral', () => {
  it('answers 200 pending while the users row is not synced yet', async () => {
    authMock.mockResolvedValue({ userId: 'user_new' })
    getUserReferralInfoMock.mockResolvedValue(null)

    const response = await GET(new Request('http://localhost/api/referral'))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ pending: true })
  })
})
