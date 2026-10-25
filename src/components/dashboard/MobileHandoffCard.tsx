"use client"

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Laptop } from 'lucide-react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

// Small screens only (the sidebar is hidden there too): the editor is built for
// a laptop, so a new user on a phone gets a one-tap way to carry on there.
export function MobileHandoffCard() {
  const t = useTranslations('Dashboard.mobileHandoff')
  const locale = useLocale()
  const [status, setStatus] = useState<Status>('idle')

  async function send() {
    setStatus('sending')
    try {
      const res = await fetch('/api/mobile-handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="lg:hidden bg-(--surface-elevated) p-6 border border-(--border) mb-8">
      <p className="flex items-center gap-2 text-sm font-bold text-(--foreground) mb-2">
        <Laptop className="h-4 w-4" /> {t('title')}
      </p>
      <p className="text-sm text-(--muted) mb-4">{t('body')}</p>
      {status === 'sent' ? (
        <p role="status" className="text-sm text-(--foreground)">{t('sent')}</p>
      ) : (
        <button
          type="button"
          onClick={send}
          disabled={status === 'sending'}
          className="bg-(--accent) text-(--accent-ink) hover:bg-(--accent-strong) px-4 py-2 text-sm font-bold transition-colors duration-150 ease-out disabled:opacity-60"
        >
          {t('cta')}
        </button>
      )}
      {status === 'error' && <p role="alert" className="mt-2 text-sm text-(--foreground)">{t('error')}</p>}
    </section>
  )
}
