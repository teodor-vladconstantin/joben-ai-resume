"use client"

import { Suspense, useCallback, useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import posthog from 'posthog-js'
import { AuthShell } from '@/components/auth/AuthShell'
import {
  isEmailAtsSource,
  parseAtsSignupAttribution,
  readAtsSignupAttribution,
  type AtsSignupAttribution,
} from '@/lib/ats-attribution'
import type { AppLocale } from '@/i18n/routing'

// localStorage so the acceptance survives new tabs (email links) and Clerk's
// multi-step flow; the server-side record is still a fresh signup_consents
// token per visit (see acceptTerms below).
const LEGAL_ACCEPTED_KEY = 'joben_legal_accepted'
const ATS_ATTRIBUTION_KEY = 'joben_ats_signup'

function readStorage(storage: 'local' | 'session', key: string): string | null {
  try {
    return (storage === 'local' ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}

function writeStorage(storage: 'local' | 'session', key: string, value: string | null): void {
  try {
    const target = storage === 'local' ? window.localStorage : window.sessionStorage
    if (value === null) target.removeItem(key)
    else target.setItem(key, value)
  } catch {
    // Storage blocked (private mode): the checkbox just isn't remembered.
  }
}

// Read back in the Clerk webhook: consentToken (ToS acceptance) and
// atsSource/atsScanId (signup_completed properties, scan claim). User-editable,
// so the webhook re-validates everything.
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

const legalLinkClass = 'text-(--foreground) underline decoration-(--border) underline-offset-2 hover:decoration-(--accent) transition-colors duration-150 ease-out'

function SignUpContent() {
  const t = useTranslations('SignUp')
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'), `/${locale}/dashboard`)
  const [checked, setChecked] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)
  const [rateLimitError, setRateLimitError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [consentToken, setConsentToken] = useState<string | null>(null)
  const [attribution, setAttribution] = useState<AtsSignupAttribution | null>(null)

  // Records the acceptance server-side (signup_consents row, same as before)
  // and only then shows Clerk's form, so the token is in unsafeMetadata from
  // the first render of <SignUp>.
  const acceptTerms = useCallback(async (source: AtsSignupAttribution['source'] | null, remembered: boolean) => {
    setRateLimitError(false)
    setSubmitting(true)
    try {
      const response = await fetch('/api/signup/consent', { method: 'POST' })
      if (response.status === 429) {
        setRateLimitError(true)
        setChecked(false)
        return
      }
      if (response.ok) {
        const data = (await response.json()) as { token?: string }
        if (data.token) setConsentToken(data.token)
      }
      // Server-side consent tracking is defense-in-depth, not a hard
      // gate: proceed to Clerk's form even if it failed, consistent
      // with this codebase's bias toward availability.
      writeStorage('local', LEGAL_ACCEPTED_KEY, '1')
      if (!remembered) posthog.capture('signup_consent_accepted', { source })
      setAccepted(true)
    } catch {
      setAccepted(true)
    } finally {
      setSubmitting(false)
    }
  }, [])

  useEffect(() => {
    // Clerk moves through /sign-up/verify-email-address etc. and drops the
    // query string, so the ATS attribution is kept for the tab's lifetime.
    const fromUrl = parseAtsSignupAttribution(new URLSearchParams(window.location.search))
    let current: AtsSignupAttribution | null = fromUrl
    if (fromUrl) {
      writeStorage('session', ATS_ATTRIBUTION_KEY, JSON.stringify({ atsSource: fromUrl.source, atsScanId: fromUrl.scanId }))
      if (isEmailAtsSource(fromUrl.source)) {
        posthog.capture('email_cta_clicked', { type: fromUrl.source.replace('email_', ''), scanId: fromUrl.scanId })
      }
      posthog.capture('signup_started_from_ats', { source: fromUrl.source, scanId: fromUrl.scanId })
    } else {
      try {
        current = readAtsSignupAttribution(JSON.parse(readStorage('session', ATS_ATTRIBUTION_KEY) || 'null'))
      } catch {
        current = null
      }
    }
    setAttribution(current)

    // Accepted earlier in this browser: the box starts ticked and a fresh
    // consent token is requested, since tokens expire after 30 minutes.
    if (readStorage('local', LEGAL_ACCEPTED_KEY) === '1') {
      setChecked(true)
      void acceptTerms(current?.source ?? null, true)
    }

    setCheckedStorage(true)
  }, [acceptTerms])

  if (!checkedStorage) {
    return null
  }

  return (
    <AuthShell eyebrow={t('eyebrow')} heading={t('heading')} subheading={t('subheading')}>
      <div className="space-y-6">
        <label className="flex items-start gap-3 border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
          <input
            type="checkbox"
            name="accept_legal"
            checked={checked}
            disabled={submitting}
            onChange={(event) => {
              const next = event.target.checked
              setChecked(next)
              if (next) {
                void acceptTerms(attribution?.source ?? null, false)
              } else {
                writeStorage('local', LEGAL_ACCEPTED_KEY, null)
                setAccepted(false)
                setConsentToken(null)
              }
            }}
            className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-(--border) bg-(--surface-elevated) accent-(--accent)"
          />
          <span>
            {t.rich('consentLabel', {
              terms: (chunks) => (
                <Link href="/terms" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank" rel="noopener noreferrer" className={legalLinkClass}>
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>

        {rateLimitError ? (
          <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2">{t('rateLimited')}</p>
        ) : null}

        {accepted ? (
          <SignUp
            routing="path"
            path={`/${locale}/sign-up`}
            signInUrl={`/${locale}/sign-in`}
            fallbackRedirectUrl={returnBackUrl}
            unsafeMetadata={buildUnsafeMetadata(consentToken, attribution)}
          />
        ) : (
          <p className="flex items-center gap-2 text-sm text-(--muted)">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('acceptToContinue')}
          </p>
        )}
      </div>
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
