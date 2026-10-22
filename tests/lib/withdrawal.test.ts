import { describe, expect, it } from 'vitest'
import { buildWithdrawalAcknowledgement, withdrawalSchema } from '@/lib/withdrawal'

describe('withdrawal', () => {
  it('requires explicit confirmation and a valid email', () => {
    const ok = { name: 'Ion Popescu', email: 'Ion@Example.com', confirm: true }
    expect(withdrawalSchema.safeParse(ok).data?.email).toBe('ion@example.com')
    expect(withdrawalSchema.safeParse({ ...ok, confirm: false }).success).toBe(false)
    expect(withdrawalSchema.safeParse({ ...ok, email: 'nope' }).success).toBe(false)
  })

  it('acknowledges with the declaration content and escapes user text', () => {
    const input = withdrawalSchema.parse({ name: '<b>Ion</b>', email: 'ion@example.com', locale: 'en', confirm: true })
    const ack = buildWithdrawalAcknowledgement(input, new Date('2026-10-22T10:00:00Z'))
    expect(ack.html).toContain('&lt;b&gt;Ion&lt;/b&gt;')
    expect(ack.html).not.toContain('<b>Ion</b>')
    expect(ack.html).toContain('2026')
  })
})
