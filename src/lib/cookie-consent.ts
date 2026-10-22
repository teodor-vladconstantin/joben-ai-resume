export type CookieConsent = 'accepted' | 'rejected'

export const COOKIE_CONSENT_KEY = 'joben_cookie_consent'
export const COOKIE_CONSENT_AT_KEY = 'joben_cookie_consent_at'
export const COOKIE_CONSENT_EVENT = 'joben-cookie-consent-changed'
export const COOKIE_SETTINGS_OPEN_EVENT = 'joben-cookie-settings-open'

// The choice is asked again after 12 months. The same limit is enforced by the
// inline script in consent-mode.ts, which runs before React.
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  if (value !== 'accepted' && value !== 'rejected') return null
  // A missing timestamp (choice saved before expiry existed) stays valid.
  const at = Number(window.localStorage.getItem(COOKIE_CONSENT_AT_KEY))
  if (at && Date.now() - at > COOKIE_CONSENT_MAX_AGE_MS) return null
  return value
}

export function setCookieConsent(value: CookieConsent): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.localStorage.setItem(COOKIE_CONSENT_AT_KEY, String(Date.now()))
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
}

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT))
}
