import { SHARED_COOKIE_DOMAIN } from '@/lib/app-origin'

export type CookieConsent = 'accepted' | 'rejected'

export const COOKIE_CONSENT_KEY = 'joben_cookie_consent'
export const COOKIE_CONSENT_AT_KEY = 'joben_cookie_consent_at'
export const COOKIE_CONSENT_EVENT = 'joben-cookie-consent-changed'
export const COOKIE_SETTINGS_OPEN_EVENT = 'joben-cookie-settings-open'

// The choice is asked again after 12 months. The same limit is enforced by the
// inline script in consent-mode.ts, which runs before React.
export const COOKIE_CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000

// localStorage is per host, so the choice is also kept in a cookie shared by
// joben.eu and app.joben.eu. Value "<choice>|<ms>". The cookie wins over
// localStorage, so a withdrawal on one host also applies on the other.
export function parseConsentCookie(raw: string | null | undefined, now = Date.now()): CookieConsent | null {
  if (!raw) return null
  const [value, at] = raw.split('|')
  if (value !== 'accepted' && value !== 'rejected') return null
  const savedAt = Number(at)
  if (savedAt && now - savedAt > COOKIE_CONSENT_MAX_AGE_MS) return null
  return value
}

export function serializeConsentCookie(value: CookieConsent, now = Date.now(), domain?: string, secure = false): string {
  return [
    `${COOKIE_CONSENT_KEY}=${value}|${now}`,
    'Path=/',
    `Max-Age=${COOKIE_CONSENT_MAX_AGE_MS / 1000}`,
    'SameSite=Lax',
    ...(domain ? [`Domain=${domain}`] : []),
    ...(secure ? ['Secure'] : []),
  ].join('; ')
}

function readConsentCookie(): string | null {
  const prefix = `${COOKIE_CONSENT_KEY}=`
  const hit = document.cookie.split('; ').find((c) => c.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : null
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const fromCookie = parseConsentCookie(readConsentCookie())
  if (fromCookie) return fromCookie
  // Choice saved in localStorage before the cookie existed.
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
  document.cookie = serializeConsentCookie(value, Date.now(), SHARED_COOKIE_DOMAIN, window.location.protocol === 'https:')
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
}

export function openCookieSettings(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(COOKIE_SETTINGS_OPEN_EVENT))
}
