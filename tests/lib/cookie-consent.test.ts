import { describe, expect, it } from 'vitest'
import { COOKIE_CONSENT_MAX_AGE_MS, parseConsentCookie, serializeConsentCookie } from '@/lib/cookie-consent'

const NOW = 1_800_000_000_000

describe('parseConsentCookie', () => {
  it('reads a fresh choice', () => {
    expect(parseConsentCookie(`accepted|${NOW - 1000}`, NOW)).toBe('accepted')
    expect(parseConsentCookie(`rejected|${NOW - 1000}`, NOW)).toBe('rejected')
  })

  it('treats a choice older than 12 months as unset', () => {
    expect(parseConsentCookie(`accepted|${NOW - COOKIE_CONSENT_MAX_AGE_MS - 1}`, NOW)).toBeNull()
  })

  it('rejects missing, unknown and malformed values', () => {
    for (const raw of [null, undefined, '', 'maybe|1', 'accepted-ish', '|']) {
      expect(parseConsentCookie(raw, NOW), String(raw)).toBeNull()
    }
  })
})

describe('serializeConsentCookie', () => {
  it('scopes the cookie to the shared parent domain and round-trips', () => {
    const header = serializeConsentCookie('accepted', NOW, '.joben.eu', true)
    expect(header).toContain('Domain=.joben.eu')
    expect(header).toContain('Secure')
    expect(header).toContain('SameSite=Lax')
    expect(header).toContain('Path=/')
    expect(parseConsentCookie(header.split('; ')[0].split('=')[1], NOW)).toBe('accepted')
  })

  it('omits Domain and Secure on a single host over http', () => {
    const header = serializeConsentCookie('rejected', NOW)
    expect(header).not.toContain('Domain=')
    expect(header).not.toContain('Secure')
  })
})
