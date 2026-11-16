import { describe, it, expect, vi, beforeEach } from 'vitest'

const setRequestLocale = vi.fn()
const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})

vi.mock('next-intl/server', () => ({ setRequestLocale }))
vi.mock('next/navigation', () => ({ notFound }))

const { enableRequestLocale } = await import('@/i18n/request-locale')

describe('enableRequestLocale', () => {
  beforeEach(() => {
    setRequestLocale.mockClear()
    notFound.mockClear()
  })

  it.each(['ro', 'en'])('registers supported locale %s with next-intl', (locale) => {
    expect(enableRequestLocale(locale)).toBe(locale)
    expect(setRequestLocale).toHaveBeenCalledWith(locale)
    expect(notFound).not.toHaveBeenCalled()
  })

  it('404s for an unsupported segment such as /api/cookies -> locale "api"', () => {
    expect(() => enableRequestLocale('api')).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledOnce()
    expect(setRequestLocale).not.toHaveBeenCalled()
  })
})
