"use client"

import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'

function sanitizeReturnBackUrl(value: string | null): string {
  if (!value) return '/dashboard'
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return '/dashboard'
  return trimmed
}

function SignInContent() {
  const searchParams = useSearchParams()
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'))

  return (
    <AuthShell eyebrow="Sign in" heading="Continue to Joben" subheading="Sign in to your account to keep building.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl={returnBackUrl} />
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
