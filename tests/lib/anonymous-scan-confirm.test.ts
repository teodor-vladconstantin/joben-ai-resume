import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { signScanConfirmToken, verifyScanConfirmToken } from '@/lib/anonymous-scan-confirm'

const SCAN = '11111111-1111-4111-8111-111111111111'

describe('scan confirm token', () => {
  beforeEach(() => {
    process.env.EMAIL_UNSUBSCRIBE_SECRET = 'test-secret'
  })
  afterEach(() => {
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET
  })

  it('verifies for the same scan and address (case-insensitive)', () => {
    const token = signScanConfirmToken(SCAN, 'User@Example.com')
    expect(token).toMatch(/^[0-9a-f]{64}$/)
    expect(verifyScanConfirmToken(SCAN, 'user@example.com', token)).toBe(true)
  })

  it('rejects a different address, a different scan, garbage and a missing secret', () => {
    const token = signScanConfirmToken(SCAN, 'user@example.com')
    expect(verifyScanConfirmToken(SCAN, 'victim@example.com', token)).toBe(false)
    expect(verifyScanConfirmToken('22222222-2222-4222-8222-222222222222', 'user@example.com', token)).toBe(false)
    expect(verifyScanConfirmToken(SCAN, 'user@example.com', 'zz')).toBe(false)
    delete process.env.EMAIL_UNSUBSCRIBE_SECRET
    expect(verifyScanConfirmToken(SCAN, 'user@example.com', token)).toBe(false)
    expect(signScanConfirmToken(SCAN, 'user@example.com')).toBeNull()
  })
})
