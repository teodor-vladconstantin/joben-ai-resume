import { beforeEach, describe, expect, it, vi } from 'vitest'

const constructEventMock = vi.fn()
const subscriptionsRetrieveMock = vi.fn()
const subscriptionsListMock = vi.fn()
const capturePostHogEventMock = vi.fn()
const createClientMock = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(function StripeMock() {
    return {
      webhooks: { constructEvent: constructEventMock },
      subscriptions: { retrieve: subscriptionsRetrieveMock, list: subscriptionsListMock },
    }
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

vi.mock('@/lib/posthog-server', () => ({
  capturePostHogEvent: capturePostHogEventMock,
}))

type UserRow = {
  id: string
  clerk_id?: string
  stripe_last_event_created?: number | null
  lifetime_recruiting_unlocked?: boolean
}

function makeSupabase(
  options: {
    webhookInsertError?: { code?: string; message?: string } | null
    users?: Record<string, UserRow | null>
    updateError?: { message: string } | null
  } = {}
) {
  const { webhookInsertError = null, users = {}, updateError = null } = options
  const insertCalls: unknown[] = []
  const updateCalls: Array<{ id: string; payload: Record<string, unknown> }> = []

  const fromMock = vi.fn((table: string) => {
    if (table === 'webhook_events') {
      return {
        insert: vi.fn((row: unknown) => {
          insertCalls.push(row)
          return Promise.resolve({ error: webhookInsertError })
        }),
      }
    }
    if (table === 'users') {
      return {
        select: vi.fn(() => ({
          eq: vi.fn((_column: string, value: string) => ({
            maybeSingle: vi.fn().mockResolvedValue({ data: users[value] ?? null, error: null }),
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn((_column: string, value: string) => {
            updateCalls.push({ id: value, payload })
            return Promise.resolve({ error: updateError })
          }),
        })),
      }
    }
    throw new Error(`Unexpected table ${table}`)
  })

  createClientMock.mockReturnValue({ from: fromMock })
  return { insertCalls, updateCalls }
}

let eventCounter = 0
function makeEvent(type: string, object: Record<string, unknown>, created = 1_700_000_000) {
  eventCounter += 1
  return { id: `evt_${type}_${eventCounter}`, type, created, data: { object } }
}

function makeRequest(event: unknown, sig: string | null = 'sig_test') {
  const headers: Record<string, string> = {}
  if (sig) headers['stripe-signature'] = sig
  return new Request('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  })
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.resetModules()
    constructEventMock.mockReset()
    subscriptionsRetrieveMock.mockReset()
    subscriptionsListMock.mockReset()
    capturePostHogEventMock.mockReset()
    createClientMock.mockReset()

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy'
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_dummy'
    process.env.STRIPE_RECRUITING_PRICE_ID = 'price_recruiting_dummy'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_dummy'

    makeSupabase()
  })

  it('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(makeRequest(makeEvent('checkout.session.completed', {})))
    expect(response.status).toBe(500)
  })

  it('returns 500 when STRIPE_SECRET_KEY is missing', async () => {
    delete process.env.STRIPE_SECRET_KEY
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(makeRequest(makeEvent('checkout.session.completed', {})))
    expect(response.status).toBe(500)
  })

  it('returns 400 when the stripe-signature header is missing', async () => {
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(makeRequest(makeEvent('checkout.session.completed', {}), null))
    expect(response.status).toBe(400)
  })

  it('returns 400 and echoes the Stripe error when signature verification fails', async () => {
    constructEventMock.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature for payload')
    })
    const { POST } = await import('@/app/api/webhooks/stripe/route')

    const response = await POST(makeRequest(makeEvent('checkout.session.completed', {})))
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(400)
    expect(payload.error).toMatch(/No signatures found/)
  })

  it('returns 200 duplicate-ignored when the event was already claimed', async () => {
    const event = makeEvent('checkout.session.completed', {})
    constructEventMock.mockReturnValue(event)
    makeSupabase({ webhookInsertError: { code: '23505' } })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(200)
    expect(payload.message).toMatch(/duplicate/i)
  })

  it('returns 500 when claiming the webhook event fails for a non-duplicate reason', async () => {
    const event = makeEvent('checkout.session.completed', {})
    constructEventMock.mockReturnValue(event)
    makeSupabase({ webhookInsertError: { code: 'XXXXX', message: 'db down' } })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(500)
  })

  it('skips a stale checkout.session.completed event without downgrading the user', async () => {
    const event = makeEvent(
      'checkout.session.completed',
      { metadata: { userId: 'user_1', planId: 'pro' }, customer: 'cus_1', subscription: 'sub_1' },
      1000
    )
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: { user_1: { id: 'row_1', stripe_last_event_created: 5000, lifetime_recruiting_unlocked: false } },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(200)
    expect(payload.message).toMatch(/stale/i)
    expect(updateCalls).toHaveLength(0)
  })

  it('skips a stale subscription event without downgrading the user', async () => {
    const event = makeEvent('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'active' }, 1000)
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 5000, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(200)
    expect(updateCalls).toHaveLength(0)
  })

  it('checkout.session.completed: syncs plan, customer id, and subscription id', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1', planId: 'pro' },
      customer: 'cus_1',
      subscription: 'sub_1',
      amount_total: 999,
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: { user_1: { id: 'row_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false } },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(200)
    expect(updateCalls).toEqual([
      {
        id: 'row_1',
        payload: {
          plan: 'pro',
          stripe_customer_id: 'cus_1',
          stripe_subscription_id: 'sub_1',
          stripe_last_event_created: event.created,
        },
      },
    ])
    expect(capturePostHogEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ distinctId: 'user_1', event: 'payment_completed' })
    )
  })

  it('checkout.session.completed: lifetime_recruiting_unlocked users are never downgraded by planId', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1', planId: 'pro' },
      customer: 'cus_1',
      subscription: 'sub_1',
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: { user_1: { id: 'row_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: true } },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload.plan).toBe('recruiting')
  })

  it('checkout.session.completed: silently skips when the user is not found', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'unknown_user', planId: 'pro' },
      customer: 'cus_1',
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({ users: {} })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(200)
    expect(updateCalls).toHaveLength(0)
  })

  it('customer.subscription.created: active subscription resolves to pro', async () => {
    const event = makeEvent('customer.subscription.created', { id: 'sub_1', customer: 'cus_1', status: 'active' })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls).toEqual([
      {
        id: 'row_1',
        payload: {
          plan: 'pro',
          stripe_subscription_id: 'sub_1',
          stripe_customer_id: 'cus_1',
          stripe_last_event_created: event.created,
        },
      },
    ])
  })

  it('customer.subscription.created: resolves plan from the subscribed price id (recruiting)', async () => {
    const event = makeEvent('customer.subscription.created', {
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      items: { data: [{ price: { id: 'price_recruiting_dummy' } }] },
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload).toMatchObject({ plan: 'recruiting', stripe_subscription_id: 'sub_1' })
  })

  it('customer.subscription.created: falls back to pro when the price id is unrecognized', async () => {
    const event = makeEvent('customer.subscription.created', {
      id: 'sub_1',
      customer: 'cus_1',
      status: 'active',
      items: { data: [{ price: { id: 'price_unknown' } }] },
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload.plan).toBe('pro')
  })

  it('customer.subscription.updated: canceled Recruiting subscription downgrades to free and nulls the subscription id', async () => {
    const event = makeEvent('customer.subscription.updated', {
      id: 'sub_1',
      customer: 'cus_1',
      status: 'canceled',
      items: { data: [{ price: { id: 'price_recruiting_dummy' } }] },
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload).toMatchObject({ plan: 'free', stripe_subscription_id: null })
  })

  it('checkout.session.completed: syncs planId "recruiting" from session metadata', async () => {
    const event = makeEvent('checkout.session.completed', {
      metadata: { userId: 'user_1', planId: 'recruiting' },
      customer: 'cus_1',
      subscription: 'sub_1',
      amount_total: 6000,
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: { user_1: { id: 'row_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false } },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload).toMatchObject({ plan: 'recruiting', stripe_subscription_id: 'sub_1' })
  })

  it('customer.subscription.updated: canceled status downgrades to free and nulls the subscription id', async () => {
    const event = makeEvent('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'canceled' })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload).toMatchObject({ plan: 'free', stripe_subscription_id: null })
  })

  it('customer.subscription.deleted: lifetime_recruiting_unlocked users stay on recruiting', async () => {
    const event = makeEvent('customer.subscription.deleted', { id: 'sub_1', customer: 'cus_1', status: 'canceled' })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: true },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(updateCalls[0]?.payload).toMatchObject({ plan: 'recruiting', stripe_subscription_id: 'sub_1' })
  })

  it('customer.subscription.updated: skips silently when the Stripe customer is not linked to any user', async () => {
    const event = makeEvent('customer.subscription.updated', { id: 'sub_1', customer: 'cus_unknown', status: 'active' })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({ users: {} })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(200)
    expect(updateCalls).toHaveLength(0)
  })

  it('invoice.payment_failed: resolves a string subscription ref via stripe.subscriptions.retrieve', async () => {
    const event = makeEvent('invoice.payment_failed', {
      customer: 'cus_1',
      parent: { subscription_details: { subscription: 'sub_1' } },
    })
    constructEventMock.mockReturnValue(event)
    subscriptionsRetrieveMock.mockResolvedValue({ id: 'sub_1', customer: 'cus_1', status: 'past_due' })
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(subscriptionsRetrieveMock).toHaveBeenCalledWith('sub_1')
    expect(updateCalls[0]?.payload.plan).toBe('pro')
  })

  it('invoice.payment_failed: uses an already-expanded subscription object without an extra retrieve call', async () => {
    const event = makeEvent('invoice.payment_failed', {
      customer: 'cus_1',
      parent: { subscription_details: { subscription: { id: 'sub_2', customer: 'cus_1', status: 'canceled' } } },
    })
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(subscriptionsRetrieveMock).not.toHaveBeenCalled()
    expect(updateCalls[0]?.payload.plan).toBe('free')
  })

  it('invoice.paid: re-syncs the plan and captures the paid amount', async () => {
    const event = makeEvent('invoice.paid', {
      customer: 'cus_1',
      parent: { subscription_details: { subscription: 'sub_1' } },
      amount_paid: 2500,
    })
    constructEventMock.mockReturnValue(event)
    subscriptionsRetrieveMock.mockResolvedValue({ id: 'sub_1', customer: 'cus_1', status: 'active' })
    makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(capturePostHogEventMock).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'payment_completed', properties: expect.objectContaining({ amount: 2500 }) })
    )
  })

  it('charge.refunded: re-syncs plan from the customer\'s latest subscription', async () => {
    const event = makeEvent('charge.refunded', { customer: 'cus_1' })
    constructEventMock.mockReturnValue(event)
    subscriptionsListMock.mockResolvedValue({ data: [{ id: 'sub_1', customer: 'cus_1', status: 'canceled' }] })
    const { updateCalls } = makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    await POST(makeRequest(event))

    expect(subscriptionsListMock).toHaveBeenCalledWith({ customer: 'cus_1', status: 'all', limit: 1 })
    expect(updateCalls[0]?.payload.plan).toBe('free')
  })

  it('ignores unhandled event types without touching the database', async () => {
    const event = makeEvent('customer.updated', {})
    constructEventMock.mockReturnValue(event)
    const { updateCalls } = makeSupabase()

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))
    const payload = (await response.json()) as { message?: string }

    expect(response.status).toBe(200)
    expect(payload.message).toMatch(/received/i)
    expect(updateCalls).toHaveLength(0)
  })

  it('returns a sanitized 500 and does not leak the raw error when handling throws', async () => {
    const event = makeEvent('invoice.payment_failed', {
      customer: 'cus_1',
      parent: { subscription_details: { subscription: 'sub_1' } },
    })
    constructEventMock.mockReturnValue(event)
    subscriptionsRetrieveMock.mockRejectedValue(new Error('internal secret db connection string leaked'))
    makeSupabase()

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(500)
    expect(payload.error).not.toMatch(/secret|connection string/i)
  })

  it('returns 500 when the plan-sync database update fails', async () => {
    const event = makeEvent('customer.subscription.updated', { id: 'sub_1', customer: 'cus_1', status: 'active' })
    constructEventMock.mockReturnValue(event)
    makeSupabase({
      users: {
        cus_1: { id: 'row_1', clerk_id: 'user_1', stripe_last_event_created: 0, lifetime_recruiting_unlocked: false },
      },
      updateError: { message: 'update failed' },
    })

    const { POST } = await import('@/app/api/webhooks/stripe/route')
    const response = await POST(makeRequest(event))

    expect(response.status).toBe(500)
  })
})
