import { describe, expect, it } from 'vitest'
import { inactivityStage } from '@/lib/account-inactivity'

const DAY = 24 * 60 * 60 * 1000
const now = Date.UTC(2028, 10, 1)

describe('inactivityStage', () => {
  it('leaves recently active accounts alone', () => {
    expect(inactivityStage({ lastActiveMs: now - 200 * DAY, nowMs: now, warnedAtMs: null })).toBe('active')
  })

  it('warns once an account has been idle for ~23 months', () => {
    expect(inactivityStage({ lastActiveMs: now - 701 * DAY, nowMs: now, warnedAtMs: null })).toBe('warn')
  })

  it('never deletes without a prior warning', () => {
    expect(inactivityStage({ lastActiveMs: now - 900 * DAY, nowMs: now, warnedAtMs: null })).toBe('warn')
  })

  it('waits until 30 days after the warning', () => {
    expect(inactivityStage({ lastActiveMs: now - 740 * DAY, nowMs: now, warnedAtMs: now - 10 * DAY })).toBe('wait')
  })

  it('deletes after 24 months idle and 30 days after the warning', () => {
    expect(inactivityStage({ lastActiveMs: now - 740 * DAY, nowMs: now, warnedAtMs: now - 31 * DAY })).toBe('delete')
  })
})
