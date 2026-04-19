import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/upstash', () => ({
  analyzeRatelimit: { limit: vi.fn() },
  coverLetterRatelimit: { limit: vi.fn() },
}))

describe('critical API route guards', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
  })

  it('returns 401 on analyze when user is missing', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/analyze/route')

    const response = await POST(
      new Request('http://localhost/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ resumeText: 'Test resume' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 401 on tailor when user is missing', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/tailor/route')

    const response = await POST(
      new Request('http://localhost/api/tailor', {
        method: 'POST',
        body: JSON.stringify({ resumeData: {}, jobDescription: 'JD' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 401 on improve-bullet when user is missing', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/improve-bullet/route')

    const response = await POST(
      new Request('http://localhost/api/improve-bullet', {
        method: 'POST',
        body: JSON.stringify({ bullet: 'Did something' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 500 for clerk webhook when secret is missing', async () => {
    process.env.CLERK_WEBHOOK_SECRET = ''
    const { POST } = await import('@/app/api/webhooks/clerk/route')

    const response = await POST(
      new Request('http://localhost/api/webhooks/clerk', {
        method: 'POST',
      })
    )

    expect(response.status).toBe(500)
  })

  it('returns 500 for stripe webhook when webhook secret is missing', async () => {
    process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy'
    process.env.STRIPE_WEBHOOK_SECRET = ''
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(
      new Request('http://localhost/api/webhooks/stripe', {
        method: 'POST',
      })
    )

    expect(response.status).toBe(500)
  })
})
