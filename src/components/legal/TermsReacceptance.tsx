'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/cn'

// Asks a signed-in user to accept the current Terms and Privacy Policy when the
// accepted version differs from LEGAL_VERSION (src/lib/legal/versions.ts).
// Hidden on /settings so a user who disagrees can still export or delete data.
export function TermsReacceptance() {
  const t = useTranslations('TermsReacceptance')
  const pathname = usePathname()
  const [needed, setNeeded] = useState(false)
  const [checked, setChecked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/account/terms', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { needsAcceptance?: boolean } | null) => {
        if (!cancelled && data?.needsAcceptance) setNeeded(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (!needed || pathname.startsWith('/settings')) return null

  const accept = async () => {
    setSaving(true)
    setFailed(false)
    try {
      const res = await fetch('/api/account/terms', { method: 'POST' })
      if (!res.ok) throw new Error('failed')
      setNeeded(false)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="terms-reaccept-title">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 id="terms-reaccept-title" className="text-lg font-bold text-foreground">{t('title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('body')}</p>
        <label className="mt-4 flex items-start gap-3 text-sm text-foreground">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1" />
          <span>
            {t.rich('label', {
              terms: (chunks) => (
                <Link href="/terms" target="_blank" className="underline underline-offset-4">{chunks}</Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" target="_blank" className="underline underline-offset-4">{chunks}</Link>
              ),
            })}
          </span>
        </label>
        {failed ? <p className="mt-3 text-sm text-foreground">{t('error')}</p> : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link href="/settings" className="text-sm text-muted-foreground underline underline-offset-4">{t('settings')}</Link>
          <button type="button" disabled={!checked || saving} onClick={accept} className={cn(buttonVariants('primary', 'sm'), 'disabled:opacity-50')}>
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
