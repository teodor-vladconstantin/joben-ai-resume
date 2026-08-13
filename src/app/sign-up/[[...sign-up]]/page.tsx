"use client"

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { buttonVariants } from '@/components/ui/Button'

const LEGAL_ACCEPTED_KEY = 'joben_legal_accepted'

function sanitizeReturnBackUrl(value: string | null): string {
  if (!value) return '/dashboard'
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return '/dashboard'
  return trimmed
}

function SignUpContent() {
  const searchParams = useSearchParams()
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'))
  const [accepted, setAccepted] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)
  const [showError, setShowError] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consentToken, setConsentToken] = useState<string | null>(null)

  useEffect(() => {
    if (window.sessionStorage.getItem(LEGAL_ACCEPTED_KEY) === '1') {
      setAccepted(true)
    }
    setCheckedStorage(true)
  }, [])

  if (!checkedStorage) {
    return null
  }

  if (!accepted) {
    return (
      <AuthShell eyebrow="Sign up" heading="Create your account" subheading="Before continuing, please review and accept our legal terms.">
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const checkbox = event.currentTarget.elements.namedItem('accept_legal') as HTMLInputElement
            if (!checkbox.checked) {
              setShowError(true)
              return
            }
            setShowError(false)
            setRateLimitError(false)
            setSubmitting(true)
            try {
              const response = await fetch('/api/signup/consent', { method: 'POST' })
              if (response.status === 429) {
                setRateLimitError(true)
                return
              }
              if (response.ok) {
                const data = (await response.json()) as { token?: string }
                if (data.token) setConsentToken(data.token)
              }
              // Server-side consent tracking is defense-in-depth, not a hard
              // gate — proceed to Clerk's form even if it failed, consistent
              // with this codebase's bias toward availability.
              window.sessionStorage.setItem(LEGAL_ACCEPTED_KEY, '1')
              setAccepted(true)
            } finally {
              setSubmitting(false)
            }
          }}
          className="space-y-4"
        >
          <label className="flex items-start gap-3 rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
            <input
              type="checkbox"
              name="accept_legal"
              className="mt-0.5 h-4 w-4 rounded border-(--border) bg-(--surface-elevated) text-(--accent)"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:text-(--accent-strong)">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:text-(--accent-strong)">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {showError ? (
            <p className="text-sm text-red-400">You must accept the terms and privacy policy to continue.</p>
          ) : null}

          {rateLimitError ? (
            <p className="text-sm text-red-400">Too many attempts from your network. Please try again later.</p>
          ) : null}

          <button type="submit" disabled={submitting} className={`w-full ${buttonVariants('primary', 'md')}`}>
            Continue to Sign Up
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell eyebrow="Sign up" heading="Continue to Joben" subheading="Create your account to get started.">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={returnBackUrl}
        unsafeMetadata={consentToken ? { consentToken } : undefined}
      />
    </AuthShell>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  )
}
