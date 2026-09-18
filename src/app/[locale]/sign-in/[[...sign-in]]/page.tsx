"use client"

import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { AuthShell } from '@/components/auth/AuthShell'
import type { AppLocale } from '@/i18n/routing'

function sanitizeReturnBackUrl(value: string | null, fallback: string): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed
}

function SignInContent() {
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'), `/${locale}/dashboard`)

  return (
    <AuthShell eyebrow="Sign in" heading="Continue to Joben" subheading="Sign in to your account to keep building.">
      <SignIn
        routing="path"
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/sign-up`}
        fallbackRedirectUrl={returnBackUrl}
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
