"use client"

import { Suspense, useSyncExternalStore } from 'react'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { AuthShell } from '@/components/auth/AuthShell'
import { readReferralCookie } from '@/lib/referral-shared'
import type { AppLocale } from '@/i18n/routing'

function sanitizeReturnBackUrl(value: string | null, fallback: string): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed
}

const noopSubscribe = () => () => {}

function SignInContent() {
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const t = useTranslations('SignIn')
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'), `/${locale}/dashboard`)
  // A new user arriving from a referral link may land here first (e.g. OAuth
  // sign-in that turns into a sign-up): Clerk carries unsafeMetadata over.
  // Cookie never changes during the visit; the server snapshot is null.
  const referralCode = useSyncExternalStore(noopSubscribe, readReferralCookie, () => null)

  return (
    <AuthShell eyebrow={t('eyebrow')} heading={t('heading')} subheading={t('subheading')}>
      <SignIn
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        fallbackRedirectUrl={returnBackUrl}
        unsafeMetadata={referralCode ? { ref: referralCode, locale } : { locale }}
      />
    </AuthShell>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
