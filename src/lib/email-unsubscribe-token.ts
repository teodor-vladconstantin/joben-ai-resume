// Signs/verifies the unsubscribe link token so a public, no-login GET/POST
// endpoint (src/app/api/email/unsubscribe/route.ts) can suppress an address
// without letting anyone suppress an arbitrary email by guessing its URL.
import { createHmac, timingSafeEqual } from 'crypto'
import { normalizeEmail } from '@/lib/security/disposable-email'

function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null
}

export function isUnsubscribeConfigured(): boolean {
  return Boolean(getSecret())
}

/** Returns null if EMAIL_UNSUBSCRIBE_SECRET is unset — callers must fail closed on null. */
export function signUnsubscribeToken(email: string): string | null {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized) return null

  return createHmac('sha256', secret).update(normalized).digest('hex')
}

export function verifyUnsubscribeToken(email: string | null, token: string | null): boolean {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized || !token) return false

  const expected = createHmac('sha256', secret).update(normalized).digest('hex')
  const expectedBuf = Buffer.from(expected, 'hex')
  const tokenBuf = Buffer.from(token, 'hex')
  if (expectedBuf.length !== tokenBuf.length) return false

  return timingSafeEqual(expectedBuf, tokenBuf)
}
