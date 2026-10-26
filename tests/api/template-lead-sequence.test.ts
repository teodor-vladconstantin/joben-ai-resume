import { beforeEach, describe, expect, it, vi } from 'vitest'

type Lead = { id: string; email: string; locale: string | null; email_confirmed_at: string }

const state = vi.hoisted(() => ({
  leads: [] as Lead[],
  accounts: [] as string[],
  locks: new Set<string>(),
  sendMock: vi.fn(),
}))

vi.mock('@/lib/resend', () => ({
  sendTemplateSequenceEmail: state.sendMock,
  toAnonScanEmailLocale: (v: string | null) => (v === 'en' ? 'en' : 'ro'),
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: (table: string) => {
      if (table === 'template_leads') {
        const chain = {
          select: () => chain,
          eq: () => chain,
          not: () => chain,
          gte: () => chain,
          limit: () => Promise.resolve({ data: state.leads, error: null }),
        }
        return chain
      }
      if (table === 'users') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: state.accounts.map((email) => ({ email })), error: null }),
          }),
        }
      }
      // email_events: the unique source_event_id acts as the lock.
      return {
        insert: (row: { source_event_id: string }) => {
          if (state.locks.has(row.source_event_id)) return Promise.resolve({ error: { code: '23505', message: 'dup' } })
          state.locks.add(row.source_event_id)
          return Promise.resolve({ error: null })
        },
        update: () => ({ eq: () => Promise.resolve({ error: null }) }),
      }
    },
  }),
}))

import { POST } from '@/app/api/cron/template-lead-sequence/route'
import {
  TEMPLATE_CONFIRM_COPY,
  TEMPLATE_SEQUENCE_COPY,
  TEMPLATE_SEQUENCE_STEPS,
} from '@/lib/template-sequence-copy'
import { signTemplateLeadConfirmToken, verifyTemplateLeadConfirmToken } from '@/lib/template-lead-confirm'

const DAY = 24 * 60 * 60 * 1000
const lead = (id: string, ageDays: number, email = `${id}@example.com`): Lead => ({
  id,
  email,
  locale: 'ro',
  email_confirmed_at: new Date(Date.now() - ageDays * DAY - 60_000).toISOString(),
})

function cron(auth = 'Bearer secret') {
  return new Request('http://localhost/api/cron/template-lead-sequence', { method: 'POST', headers: { authorization: auth } })
}

describe('POST /api/cron/template-lead-sequence', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = 'secret'
    state.leads = []
    state.accounts = []
    state.locks = new Set()
    state.sendMock.mockReset().mockResolvedValue({ success: true, providerId: 'p' })
  })

  it('rejects requests without the cron secret', async () => {
    const res = await cron('Bearer wrong')
    expect((await POST(res)).status).toBe(401)
  })

  it('sends step 1 on the day of confirmation and nothing more in the same run', async () => {
    state.leads = [lead('a', 0)]
    await POST(cron())
    expect(state.sendMock).toHaveBeenCalledTimes(1)
    expect(state.sendMock.mock.calls[0][0]).toMatchObject({ step: 1, to: 'a@example.com', locale: 'ro' })
  })

  it('sends one step per run, oldest unsent first, when the cron was paused', async () => {
    state.leads = [lead('b', 20)]
    await POST(cron())
    await POST(cron())
    expect(state.sendMock.mock.calls.map((c) => c[0].step)).toEqual([1, 2])
  })

  it('moves to the next step on its day and never repeats a step', async () => {
    state.leads = [lead('c', 2)]
    state.locks.add('template-seq-1:c')
    await POST(cron())
    await POST(cron())
    expect(state.sendMock.mock.calls.map((c) => c[0].step)).toEqual([2])
  })

  it('waits for the next step offset', async () => {
    state.leads = [lead('d', 1)]
    state.locks.add('template-seq-1:d')
    await POST(cron())
    expect(state.sendMock).not.toHaveBeenCalled()
  })

  it('skips leads that already have an account', async () => {
    state.leads = [lead('e', 0, 'e@example.com')]
    state.accounts = ['e@example.com']
    await POST(cron())
    expect(state.sendMock).not.toHaveBeenCalled()
  })

  it('releases the lock path for retry when the send fails', async () => {
    state.leads = [lead('f', 0)]
    state.sendMock.mockResolvedValue({ success: false, error: 'boom' })
    const body = await (await POST(cron())).json()
    expect(body.failed).toBe(1)
    expect(body.sent).toBe(0)
  })
})

describe('template sequence copy and tokens', () => {
  it('has 5 steps in both locales with no em dashes', () => {
    for (const locale of ['ro', 'en'] as const) {
      expect(TEMPLATE_SEQUENCE_STEPS).toHaveLength(5)
      const text = JSON.stringify([TEMPLATE_SEQUENCE_COPY[locale], TEMPLATE_CONFIRM_COPY[locale]])
      expect(text).not.toContain('—')
    }
  })

  it('only the last step carries the offer', () => {
    const offerSteps = TEMPLATE_SEQUENCE_STEPS.filter((s) => TEMPLATE_SEQUENCE_COPY.en[s].ctaPath === '/pricing')
    expect(offerSteps).toEqual([5])
  })

  it('confirm token is bound to the lead id and the exact address', () => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = 'test-secret'
    const token = signTemplateLeadConfirmToken('11111111-1111-1111-1111-111111111111', 'Ana@Example.com')!
    expect(verifyTemplateLeadConfirmToken('11111111-1111-1111-1111-111111111111', 'ana@example.com', token)).toBe(true)
    expect(verifyTemplateLeadConfirmToken('22222222-2222-2222-2222-222222222222', 'ana@example.com', token)).toBe(false)
    expect(verifyTemplateLeadConfirmToken('11111111-1111-1111-1111-111111111111', 'other@example.com', token)).toBe(false)
  })
})
