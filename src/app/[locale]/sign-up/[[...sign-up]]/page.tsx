"use client"

import { Suspense, useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import posthog from 'posthog-js'
import { AuthShell } from '@/components/auth/AuthShell'
import { buttonVariants } from '@/components/ui/Button'
import {
  isEmailAtsSource,
  parseAtsSignupAttribution,
  readAtsSignupAttribution,
  type AtsSignupAttribution,
} from '@/lib/ats-attribution'
import type { AppLocale } from '@/i18n/routing'

const LEGAL_ACCEPTED_KEY = 'joben_legal_accepted'
const ATS_ATTRIBUTION_KEY = 'joben_ats_signup'

// Read back in the Clerk webhook: consentToken (ToS acceptance) and
// atsSource/atsScanId (signup_completed properties). User-editable, so the
// webhook re-validates everything.
function buildUnsafeMetadata(
  consentToken: string | null,
  attribution: AtsSignupAttribution | null
): Record<string, string> | undefined {
  const metadata: Record<string, string> = {}
  if (consentToken) metadata.consentToken = consentToken
  if (attribution) {
    metadata.atsSource = attribution.source
    if (attribution.scanId) metadata.atsScanId = attribution.scanId
  }
  return Object.keys(metadata).length > 0 ? metadata : undefined
}

function sanitizeReturnBackUrl(value: string | null, fallback: string): string {
  if (!value) return fallback
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback
  return trimmed
}

function SignUpContent() {
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'), `/${locale}/dashboard`)
  const [accepted, setAccepted] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)
  const [showError, setShowError] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consentToken, setConsentToken] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<AtsSignupAttribution | null>(null)

  useEffect(() => {
    if (window.sessionStorage.getItem(LEGAL_ACCEPTED_KEY) === '1') {
      setAccepted(true)
    }

    // Clerk moves through /sign-up/verify-email-address etc. and drops the
    // query string, so the ATS attribution is kept for the tab's lifetime.
    const fromUrl = parseAtsSignupAttribution(new URLSearchParams(window.location.search))
    if (fromUrl) {
      window.sessionStorage.setItem(ATS_ATTRIBUTION_KEY, JSON.stringify({ atsSource: fromUrl.source, atsScanId: fromUrl.scanId }))
      if (isEmailAtsSource(fromUrl.source)) {
        posthog.capture('email_cta_clicked', { type: fromUrl.source.replace('email_', ''), scanId: fromUrl.scanId })
      }
      posthog.capture('signup_started_from_ats', { source: fromUrl.source, scanId: fromUrl.scanId })
      setAttribution(fromUrl)
    } else {
      try {
        setAttribution(readAtsSignupAttribution(JSON.parse(window.sessionStorage.getItem(ATS_ATTRIBUTION_KEY) || 'null')))
      } catch {
        setAttribution(null)
      }
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
              posthog.capture('signup_consent_accepted', { source: attribution?.source ?? null })
              setAccepted(true)
            } finally {
              setSubmitting(false)
            }
          }}
          className="space-y-4"
        >
          <label className="flex items-start gap-3 border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
            <input
              type="checkbox"
              name="accept_legal"
              className="mt-0.5 h-4 w-4 rounded-sm border-(--border) bg-(--surface-elevated) accent-(--accent)"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-(--foreground) border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-(--foreground) border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {showError ? (
            <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2">You must accept the terms and privacy policy to continue.</p>
          ) : null}

          {rateLimitError ? (
            <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2">Too many attempts from your network. Please try again later.</p>
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
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
        fallbackRedirectUrl={returnBackUrl}
        unsafeMetadata={buildUnsafeMetadata(consentToken, attribution)}
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
