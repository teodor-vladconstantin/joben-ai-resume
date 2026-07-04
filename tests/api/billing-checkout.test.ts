import { describe, expect, it } from 'vitest'

describe('billing checkout API', () => {
  it('refuses to start checkout while payments are disabled', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', { method: 'POST' })
    )
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(403)
    expect(payload.error).toMatch(/testing/i)
  })

  it('refuses even without authentication', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', { method: 'POST' })
    )

    expect(response.status).toBe(403)
  })
})
