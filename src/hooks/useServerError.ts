'use client'

import { useCallback } from 'react'
import { useLocale, useTranslations } from 'next-intl'

// API routes answer in English (they don't know the UI locale). On English
// pages the server text is the most specific message; elsewhere show the
// caller's translated fallback instead of mixing English into the page.
export function useServerError() {
  const locale = useLocale()
  const t = useTranslations('Shared')
  return useCallback(
    (payload: { error?: string } | null | undefined, fallback: string, status?: number) => {
      if (locale === 'en' && payload?.error) return payload.error
      if (status === 429) return t('rateLimited')
      return fallback
    },
    [locale, t]
  )
}
