// SECURITY: blocks free-trial abuse via throwaway inboxes (mailinator.com,
// 10minutemail.com, etc). Static list, no network call — the webhook has no
// good failure mode for an external lookup timing out.
import disposableDomains from 'disposable-email-domains/index.json'

const DOMAIN_SET = new Set<string>(disposableDomains as string[])

export function normalizeEmail(email: string | null | undefined): string | null {
  const trimmed = (email || '').trim().toLowerCase()
  return trimmed.length > 0 ? trimmed : null
}

export function isDisposableEmailDomain(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email)
  const domain = normalized?.split('@')[1]
  return Boolean(domain) && DOMAIN_SET.has(domain as string)
}
