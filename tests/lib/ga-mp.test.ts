import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendGaPurchase } from '@/lib/ga-mp'
import { getGaClientId } from '@/lib/gtm-events'
import { checkoutRequestSchema } from '@/lib/validation/schemas'

const purchase = { clientId: '123456789.987654321', transactionId: 'cs_1', plan: 'pass_14d', value: 39, currency: 'RON' }

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('sendGaPurchase', () => {
  it('is a no-op without GA4 credentials', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await sendGaPurchase(purchase)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('posts one purchase event with transaction id, value and currency', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST')
    vi.stubEnv('GA4_MP_API_SECRET', 'secret')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
    await sendGaPurchase(purchase)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('measurement_id=G-TEST')
    const body = JSON.parse(init.body)
    expect(body.client_id).toBe(purchase.clientId)
    expect(body.events[0]).toMatchObject({ name: 'purchase', params: { transaction_id: 'cs_1', value: 39, currency: 'RON' } })
  })

  it('swallows network errors so the webhook never fails on analytics', async () => {
    vi.stubEnv('GA4_MEASUREMENT_ID', 'G-TEST')
    vi.stubEnv('GA4_MP_API_SECRET', 'secret')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    await expect(sendGaPurchase(purchase)).resolves.toBeUndefined()
  })
})

describe('checkout gaClientId', () => {
  it('accepts a _ga style client id and rejects junk', () => {
    expect(checkoutRequestSchema.safeParse({ plan: 'pro', gaClientId: '123456789.987654321' }).success).toBe(true)
    expect(checkoutRequestSchema.safeParse({ plan: 'pro', gaClientId: 'x; DROP' }).success).toBe(false)
  })

  it('reads the client id from the _ga cookie only when present', () => {
    vi.stubGlobal('document', { cookie: 'a=b; _ga=GA1.1.123456789.987654321; c=d' })
    expect(getGaClientId()).toBe('123456789.987654321')
    vi.stubGlobal('document', { cookie: 'a=b' })
    expect(getGaClientId()).toBeUndefined()
  })
})
