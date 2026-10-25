import { describe, it, expect } from 'vitest'
import {
  NO_TOUR_STATE,
  TOUR_IDS,
  isTourId,
  parseOnboarding,
  shouldAutoStart,
  withChecklistDismissed,
  withTourSeen,
} from '@/lib/onboarding/state'

describe('isTourId', () => {
  it('accepts every registered id and rejects anything else', () => {
    for (const id of TOUR_IDS) expect(isTourId(id)).toBe(true)
    expect(isTourId('settings')).toBe(false)
    expect(isTourId(undefined)).toBe(false)
    expect(isTourId(7)).toBe(false)
  })
})

describe('parseOnboarding', () => {
  it('returns a clean default for empty or malformed input', () => {
    const empty = { legacy: false, tours: {}, checklistDismissedAt: null }
    expect(parseOnboarding({})).toEqual(empty)
    expect(parseOnboarding(null)).toEqual(empty)
    expect(parseOnboarding('x')).toEqual(empty)
    expect(parseOnboarding([1])).toEqual(empty)
  })

  it('keeps valid fields and drops unknown tour ids and non-string values', () => {
    const parsed = parseOnboarding({
      legacy: true,
      tours: { dashboard: '2026-10-25T10:00:00Z', ghost: '2026-10-25T10:00:00Z', editor: 5 },
      checklistDismissedAt: '2026-10-25T11:00:00Z',
    })
    expect(parsed).toEqual({
      legacy: true,
      tours: { dashboard: '2026-10-25T10:00:00Z' },
      checklistDismissedAt: '2026-10-25T11:00:00Z',
    })
  })
})

describe('withTourSeen', () => {
  it('adds the tour and keeps unrelated keys', () => {
    const next = withTourSeen({ legacy: false, extra: 1, tours: { dashboard: 'a' } }, 'editor', 'now')
    expect(next).toEqual({ legacy: false, extra: 1, tours: { dashboard: 'a', editor: 'now' } })
  })

  it('keeps the first timestamp when the tour was already seen', () => {
    const next = withTourSeen({ tours: { dashboard: 'first' } }, 'dashboard', 'second')
    expect(next).toEqual({ tours: { dashboard: 'first' } })
  })

  it('works from null', () => {
    expect(withTourSeen(null, 'resumes', 'now')).toEqual({ tours: { resumes: 'now' } })
  })
})

describe('withChecklistDismissed', () => {
  it('sets the timestamp and keeps the rest', () => {
    expect(withChecklistDismissed({ tours: { dashboard: 'a' } }, 'now')).toEqual({
      tours: { dashboard: 'a' },
      checklistDismissedAt: 'now',
    })
  })
})

describe('shouldAutoStart', () => {
  const fresh = parseOnboarding({})

  it('starts for a new user on desktop who has not seen the tour', () => {
    expect(shouldAutoStart({ state: fresh, tourId: 'dashboard', isDesktop: true })).toBe(true)
  })

  it('does not start on small screens', () => {
    expect(shouldAutoStart({ state: fresh, tourId: 'dashboard', isDesktop: false })).toBe(false)
  })

  it('does not start for legacy users or the unreadable-state fallback', () => {
    expect(shouldAutoStart({ state: parseOnboarding({ legacy: true }), tourId: 'dashboard', isDesktop: true })).toBe(false)
    expect(shouldAutoStart({ state: NO_TOUR_STATE, tourId: 'dashboard', isDesktop: true })).toBe(false)
  })

  it('does not start a tour that was already seen, but starts the others', () => {
    const state = parseOnboarding({ tours: { dashboard: 'a' } })
    expect(shouldAutoStart({ state, tourId: 'dashboard', isDesktop: true })).toBe(false)
    expect(shouldAutoStart({ state, tourId: 'editor', isDesktop: true })).toBe(true)
  })
})
