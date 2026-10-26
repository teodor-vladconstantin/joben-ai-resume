'use client'

import { useState } from 'react'
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

  function handleClick() {
    if (gatePassed()) {
      startDownload(href, ctaId)
      return
    }
    setOpen(true)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!acceptedTerms || submitting) return
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
          {error ? <p role="alert" className="text-xs text-red-500">{error}</p> : null}
          <button
            type="submit"
            disabled={!email || !acceptedTerms || submitting}
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
