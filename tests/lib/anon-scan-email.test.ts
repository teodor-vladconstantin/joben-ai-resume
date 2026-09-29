import { describe, expect, it } from 'vitest'
import { anonScanCtaUrl, escapeHtml, toAnonScanEmailLocale } from '@/lib/resend'

describe('anonymous scan email helpers', () => {
  it('escapes model-written issue text before it goes into HTML', () => {
    expect(escapeHtml(`<img src=x onerror="a('b')"> & co`)).toBe(
      '&lt;img src=x onerror=&quot;a(&#39;b&#39;)&quot;&gt; &amp; co'
    )
  })

  it('builds a locale-prefixed sign-up CTA with utm params and the scan id', () => {
    const url = new URL(anonScanCtaUrl('en', '48h', '11111111-2222-3333-4444-555555555555'))
    expect(url.pathname).toBe('/en/sign-up')
    expect(url.searchParams.get('utm_source')).toBe('email')
    expect(url.searchParams.get('utm_campaign')).toBe('anon_scan_48h')
    expect(url.searchParams.get('scan')).toBe('11111111-2222-3333-4444-555555555555')
  })

  it('treats anything other than "en" (including NULL rows) as ro', () => {
    expect(toAnonScanEmailLocale('en')).toBe('en')
    expect(toAnonScanEmailLocale('ro')).toBe('ro')
    expect(toAnonScanEmailLocale(null)).toBe('ro')
    expect(toAnonScanEmailLocale('de')).toBe('ro')
  })
})
