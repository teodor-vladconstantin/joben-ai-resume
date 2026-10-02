import { describe, expect, it } from 'vitest'

import { BROWSER_NOISE_ERRORS, BROWSER_NOISE_URLS } from '@/lib/security/sentry-scrub'

const matches = (patterns: RegExp[], value: string) => patterns.some((p) => p.test(value))

describe('browser noise filters', () => {
  it.each([
    'Error invoking postMessage: Java object is gone',
    'Non-Error promise rejection captured with value: Object Not Found Matching Id:3, MethodName:update, ParamCount:4',
    "Can't find variable: _AutofillCallbackHandler",
    'ResizeObserver loop completed with undelivered notifications.',
  ])('drops injected-script error: %s', (message) => {
    expect(matches(BROWSER_NOISE_ERRORS, message)).toBe(true)
  })

  it.each([
    'Failed to fetch',
    'Load failed',
    'ChunkLoadError: Loading chunk 123 failed.',
    "Cannot read properties of undefined (reading 'sections')",
    'Hydration failed because the server rendered HTML did not match the client.',
    'Minified React error #418',
  ])('keeps real app error: %s', (message) => {
    expect(matches(BROWSER_NOISE_ERRORS, message)).toBe(false)
  })

  it('denies injected script frames and keeps our own bundles', () => {
    expect(matches(BROWSER_NOISE_URLS, 'app://navigation_performance_logger_android')).toBe(true)
    expect(matches(BROWSER_NOISE_URLS, 'chrome-extension://abc/content.js')).toBe(true)
    expect(matches(BROWSER_NOISE_URLS, 'https://joben.eu/_next/static/chunks/main.js')).toBe(false)
    expect(matches(BROWSER_NOISE_URLS, 'app:///_next/static/chunks/main.js')).toBe(false)
  })
})
