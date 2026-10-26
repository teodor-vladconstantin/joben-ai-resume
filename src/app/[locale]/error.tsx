"use client"
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { buttonVariants } from '@/components/ui/Button'
import { getCookieConsent } from '@/lib/cookie-consent'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('ErrorPages.error')

  useEffect(() => {
    console.error(error)
    // A segment error boundary swallows the error before Sentry's global handlers see it.
    Sentry.captureException(error)
    if (
      process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
      process.env.NODE_ENV === 'production' &&
      getCookieConsent() === 'accepted'
    ) {
      posthog.captureException(error)
    }
  }, [error])

  return (
    <div className="min-h-screen bg-(--background) flex items-center px-4">
      <div className="max-w-md">
        <p className="font-mono text-sm text-(--muted) mb-3">500</p>
        <h1 className="text-2xl font-bold text-(--foreground) mb-3">{t('title')}</h1>
        <p className="text-(--muted) text-sm mb-8">{t('description')}</p>
        <button
          onClick={reset}
          className={buttonVariants('primary', 'md')}
        >
          {t('retry')}
        </button>
      </div>
    </div>
  )
}
