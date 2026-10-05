// Signed double opt-in token for the anonymous ATS checker. Binds a scan id to
// the exact address that was typed in, so the confirm link only works for the
// recipient of that email. Domain-separated from the unsubscribe token.
import { createHmac, timingSafeEqual } from 'crypto'
import { normalizeEmail } from '@/lib/security/disposable-email'

function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null
}

function compute(secret: string, scanId: string, email: string): string {
  return createHmac('sha256', secret).update(`scan-confirm:${scanId}:${email}`).digest('hex')
}

export function signScanConfirmToken(scanId: string, email: string): string | null {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized) return null
  return compute(secret, scanId, normalized)
}

export function verifyScanConfirmToken(scanId: string, email: string | null, token: string | null): boolean {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized || !token) return false

  const expected = Buffer.from(compute(secret, scanId, normalized), 'hex')
  const supplied = Buffer.from(token, 'hex')
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}
