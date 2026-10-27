'use client'

import { useEffect, useRef, useState } from 'react'
import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'
import { useLocale, useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { buttonVariants } from '@/components/ui/Button'
import { Link } from '@/i18n/navigation'
import { pushGtmEvent } from '@/lib/gtm-events'
import { useServerError } from '@/hooks/useServerError'

const GATE_PASSED_KEY = 'joben_template_gate_passed'
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string
  remove: (id: string) => void
}

function loadTurnstile(): Promise<TurnstileApi> {
  const w = window as unknown as { turnstile?: TurnstileApi }
  if (w.turnstile) return Promise.resolve(w.turnstile)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = TURNSTILE_SRC
    script.async = true
    script.onload = () => (w.turnstile ? resolve(w.turnstile) : reject(new Error('turnstile missing')))
    script.onerror = () => reject(new Error('turnstile failed to load'))
    document.head.appendChild(script)
  })
}

const legalLinkClass = 'text-(--foreground) underline decoration-(--border) underline-offset-2 hover:decoration-(--accent) transition-colors duration-150 ease-out'

type TemplateDownloadGateProps = {
  href: string
  ctaId: string
  templateId: 'classic' | 'student' | 'career-change'
  className?: string
  children: React.ReactNode
}

// posthog.capture() is a no-op until the visitor accepts analytics cookies; the
// distinct id only goes to the server under the same condition.
function consentedDistinctId(): string | null {
  try {
    return posthog.__loaded && posthog.has_opted_in_capturing() ? posthog.get_distinct_id() : null
  } catch {
    return null
  }
}

function gatePassed(): boolean {
  try {
    return localStorage.getItem(GATE_PASSED_KEY) === '1'
  } catch {
    return false
  }
}

function startDownload(href: string, ctaId: string) {
  pushGtmEvent('cta_click', { cta_id: ctaId, destination: href })
  posthog.capture('template_downloaded', { cta_id: ctaId, destination: href })
  const link = document.createElement('a')
  link.href = href
  link.download = ''
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Download button for a CV template. The first download asks for an email and
// the terms checkbox; marketing is a separate optional checkbox. Once passed,
// later downloads on this browser skip the modal. The DOCX files stay public
// static assets, so this is a soft gate: it collects leads, it does not DRM.
export function TemplateDownloadGate({ href, ctaId, templateId, className, children }: TemplateDownloadGateProps) {
  const t = useTranslations('TemplateGate')
  const serverError = useServerError()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const captchaRef = useRef<HTMLDivElement>(null)

  // Without a site key (local dev) the server skips the check, so the button
  // must not wait for a token that will never come. In production the server
  // fails closed, so a missing key must surface as an error instead.
  const captchaRequired = Boolean(TURNSTILE_SITE_KEY) || process.env.NODE_ENV === 'production'

  useEffect(() => {
    if (!open || !captchaRequired) return
    if (!TURNSTILE_SITE_KEY) {
      Sentry.captureMessage('NEXT_PUBLIC_TURNSTILE_SITE_KEY missing in production build', 'error')
      setError(t('error'))
      return
    }
    let widgetId: string | null = null
    let api: TurnstileApi | null = null
    let cancelled = false
    // The modal content mounts after `open` flips, so wait a frame for the ref.
    const frame = requestAnimationFrame(() => {
      const el = captchaRef.current
      if (!el) return
      loadTurnstile()
        .then((turnstile) => {
          if (cancelled) return
          api = turnstile
          widgetId = turnstile.render(el, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: setCaptchaToken,
            'expired-callback': () => setCaptchaToken(null),
            'error-callback': () => setCaptchaToken(null),
          })
        })
        .catch(() => setError(t('error')))
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      if (api && widgetId) api.remove(widgetId)
      setCaptchaToken(null)
    }
  }, [open, captchaRequired, t])

  function handleClick() {
    if (gatePassed()) {
      startDownload(href, ctaId)
      return
    }
    setOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!acceptedTerms || submitting || (captchaRequired && !captchaToken)) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/public/template-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          templateId,
          locale,
          termsAccepted: true,
          marketingConsent,
          captchaToken: captchaToken ?? 'dev',
          posthogDistinctId: consentedDistinctId(),
        }),
      })
      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null)
        setError(serverError(data as { error?: string } | null, t('error'), res.status))
        return
      }
      try {
        localStorage.setItem(GATE_PASSED_KEY, '1')
      } catch {
        // Private mode: the modal simply shows again next time.
      }
      pushGtmEvent('generate_lead', { source: 'template_gate' })
      setOpen(false)
      startDownload(href, ctaId)
    } catch {
      setError(t('error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick}>
        {children}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={t('title')} maxWidth="md">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <p className="text-sm text-(--muted)">{t('body')}</p>
          <Input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            aria-label={t('emailPlaceholder')}
          />
          <label className="flex items-start gap-3 text-xs text-(--muted)">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-(--border) bg-(--surface-elevated) accent-(--accent)"
            />
            <span>
              {t.rich('termsLabel', {
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
          <label className="flex items-start gap-3 text-xs text-(--muted)">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border-(--border) bg-(--surface-elevated) accent-(--accent)"
            />
            <span>{t('marketingLabel')}</span>
          </label>
          {captchaRequired ? <div ref={captchaRef} className="min-h-[65px]" /> : null}
          {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={!email || !acceptedTerms || submitting || (captchaRequired && !captchaToken)}
            className={`w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${buttonVariants('primary', 'md')}`}
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('submit')}
          </button>
        </form>
      </Modal>
    </>
  )
}
