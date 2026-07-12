export type CookieConsent = 'accepted' | 'rejected'

export const COOKIE_CONSENT_KEY = 'joben_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'joben-cookie-consent-changed'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'accepted' || value === 'rejected' ? value : null
}

export function setCookieConsent(value: CookieConsent): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
}
