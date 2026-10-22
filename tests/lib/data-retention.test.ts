import { describe, expect, it } from 'vitest'
import { RETENTION_RULES, retentionCutoff } from '@/lib/data-retention'

describe('data retention', () => {
  it('computes the cutoff as now minus the window', () => {
    const now = new Date('2026-10-22T00:00:00.000Z')
    expect(retentionCutoff(90, now)).toBe('2026-07-24T00:00:00.000Z')
  })

  it('only sweeps anonymous scans nobody has claimed', () => {
    const rule = RETENTION_RULES.find((r) => r.table === 'anonymous_scans')
    expect(rule).toMatchObject({ days: 90, unownedColumn: 'claimed_by' })
  })

  it('measures signup consents on accepted_at, which has no created_at', () => {
    expect(RETENTION_RULES.find((r) => r.table === 'signup_consents')?.column).toBe('accepted_at')
  })
})
