import { describe, expect, it } from 'vitest'
import { CONSENT_MODE_DEFAULT_SCRIPT } from '@/lib/consent-mode'

// Runs the inline script the way the browser does, with a fake document and storage.
function analyticsStorage(cookie: string, local: Record<string, string> = {}): string {
  const calls: unknown[][] = []
  const window = { dataLayer: calls }
  const run = new Function('window', 'document', 'localStorage', 'dataLayer', CONSENT_MODE_DEFAULT_SCRIPT + '; return dataLayer;')
  run(window, { cookie }, { getItem: (k: string) => local[k] ?? null }, calls)
  const consent = calls.map((c) => Array.from(c as ArrayLike<unknown>)).find((c) => c[0] === 'consent' && c[1] === 'default')
  return (consent?.[2] as Record<string, string>).analytics_storage
}

describe('consent mode default script', () => {
  const now = Date.now()

  it('grants analytics from the shared cookie', () => {
    expect(analyticsStorage(`a=1; joben_cookie_consent=accepted|${now}; b=2`)).toBe('granted')
  })

  it('denies when the shared cookie says rejected, even if localStorage still says accepted', () => {
    expect(analyticsStorage(`joben_cookie_consent=rejected|${now}`, { joben_cookie_consent: 'accepted', joben_cookie_consent_at: String(now) })).toBe('denied')
  })

  it('falls back to localStorage for choices saved before the cookie existed', () => {
    expect(analyticsStorage('', { joben_cookie_consent: 'accepted', joben_cookie_consent_at: String(now) })).toBe('granted')
  })

  it('denies by default and after 12 months', () => {
    expect(analyticsStorage('')).toBe('denied')
    expect(analyticsStorage(`joben_cookie_consent=accepted|${now - 366 * 24 * 60 * 60 * 1000}`)).toBe('denied')
  })
})
