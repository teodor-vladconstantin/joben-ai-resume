import { describe, expect, it } from 'vitest'
import { isDisposableEmailDomain, normalizeEmail } from '@/lib/security/disposable-email'

describe('normalizeEmail', () => {
  it('trims and lowercases', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com')
  })

  it('returns null for empty/missing input', () => {
    expect(normalizeEmail('')).toBeNull()
    expect(normalizeEmail(null)).toBeNull()
    expect(normalizeEmail(undefined)).toBeNull()
  })
})

describe('isDisposableEmailDomain', () => {
  it('flags known disposable domains', () => {
    expect(isDisposableEmailDomain('someone@mailinator.com')).toBe(true)
    expect(isDisposableEmailDomain('someone@10minutemail.com')).toBe(true)
  })

  it('is case-insensitive on the domain', () => {
    expect(isDisposableEmailDomain('someone@MAILINATOR.COM')).toBe(true)
  })

  it('allows legitimate domains', () => {
    expect(isDisposableEmailDomain('someone@gmail.com')).toBe(false)
    expect(isDisposableEmailDomain('someone@joben.eu')).toBe(false)
  })

  it('handles missing/malformed input', () => {
    expect(isDisposableEmailDomain(null)).toBe(false)
    expect(isDisposableEmailDomain(undefined)).toBe(false)
    expect(isDisposableEmailDomain('not-an-email')).toBe(false)
  })
})
