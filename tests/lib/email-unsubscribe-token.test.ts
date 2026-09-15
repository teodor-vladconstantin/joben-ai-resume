import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isUnsubscribeConfigured,
  signUnsubscribeToken,
  verifyUnsubscribeToken,
} from '@/lib/email-unsubscribe-token'

describe('email-unsubscribe-token', () => {
  const ORIGINAL_SECRET = process.env.EMAIL_UNSUBSCRIBE_SECRET

  beforeEach(() => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = 'test-secret-value'
  })

  afterEach(() => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = ORIGINAL_SECRET
  })

  it('reports configured when the secret is set', () => {
    expect(isUnsubscribeConfigured()).toBe(true)
  })

  it('reports not configured when the secret is unset', () => {
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET
    expect(isUnsubscribeConfigured()).toBe(false)
  })

  it('signs a token and verifies it for the same (normalized) email', () => {
    const token = signUnsubscribeToken('Someone@Example.com')
    expect(token).toBeTruthy()
    expect(verifyUnsubscribeToken('someone@example.com  ', token)).toBe(true)
  })

  it('rejects a token for a different email', () => {
    const token = signUnsubscribeToken('someone@example.com')
    expect(verifyUnsubscribeToken('someone-else@example.com', token)).toBe(false)
  })

  it('rejects a tampered token', () => {
    const token = signUnsubscribeToken('someone@example.com') as string
    const tampered = token.slice(0, -1) + (token.at(-1) === '0' ? '1' : '0')
    expect(verifyUnsubscribeToken('someone@example.com', tampered)).toBe(false)
  })

  it('returns null/false when the secret is not configured', () => {
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET
    expect(signUnsubscribeToken('someone@example.com')).toBeNull()
    expect(verifyUnsubscribeToken('someone@example.com', 'anything')).toBe(false)
  })

  it('rejects missing email or token', () => {
    const token = signUnsubscribeToken('someone@example.com')
    expect(verifyUnsubscribeToken(null, token)).toBe(false)
    expect(verifyUnsubscribeToken('someone@example.com', null)).toBe(false)
  })
})
