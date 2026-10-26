// Signed double opt-in token for the template-download email sequence. Binds a
// lead id to the exact address that was typed in, so the confirm link only
// works for the recipient of that email. Domain-separated from the scan
// confirm and unsubscribe tokens.
import { createHmac, timingSafeEqual } from 'crypto'
import { normalizeEmail } from '@/lib/security/disposable-email'

function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET || null
}

function compute(secret: string, leadId: string, email: string): string {
  return createHmac('sha256', secret).update(`template-lead-confirm:${leadId}:${email}`).digest('hex')
}

export function signTemplateLeadConfirmToken(leadId: string, email: string): string | null {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized) return null
  return compute(secret, leadId, normalized)
}

export function verifyTemplateLeadConfirmToken(leadId: string, email: string | null, token: string | null): boolean {
  const secret = getSecret()
  const normalized = normalizeEmail(email)
  if (!secret || !normalized || !token) return false

  const expected = Buffer.from(compute(secret, leadId, normalized), 'hex')
  const supplied = Buffer.from(token, 'hex')
  return expected.length === supplied.length && timingSafeEqual(expected, supplied)
}
