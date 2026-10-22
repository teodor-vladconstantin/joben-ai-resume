'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'

type Step = 'form' | 'review' | 'done'

const inputClass =
  'w-full rounded-sm border border-(--border) bg-(--surface) px-4 py-2.5 text-sm text-(--foreground) transition-colors duration-150 ease-out focus:border-(--accent) focus:outline-none'

// Two steps as the directive requires: fill in the details, then a separate
// confirmation button ("confirm withdrawal here") sends the declaration.
export function WithdrawalForm() {
  const t = useTranslations('Withdrawal')
  const locale = useLocale()
  const { user } = useUser()
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [contractRef, setContractRef] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [receivedAt, setReceivedAt] = useState<string | null>(null)

  const accountEmail = user?.primaryEmailAddress?.emailAddress ?? ''
  const accountName = user?.fullName ?? ''
  const effectiveName = name || accountName
  const effectiveEmail = email || accountEmail
  const canReview = effectiveName.trim().length >= 2 && /\S+@\S+\.\S+/.test(effectiveEmail)

  const submit = async () => {
    setSending(true)
    setError(null)
    try {
      const response = await fetch('/api/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: effectiveName,
          email: effectiveEmail,
          contractRef: contractRef || undefined,
          locale: locale === 'en' ? 'en' : 'ro',
          confirm: true,
        }),
      })
      const payload = (await response.json().catch(() => ({}))) as { receivedAt?: string }
      if (!response.ok) {
        setError(t('error'))
        return
      }
      setReceivedAt(payload.receivedAt ?? new Date().toISOString())
      setStep('done')
    } catch {
      setError(t('error'))
    } finally {
      setSending(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="border border-(--border) p-6" role="status">
        <h2 className="text-lg font-semibold text-(--foreground)">{t('doneTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">{t('doneBody', { email: effectiveEmail })}</p>
        {receivedAt && (
          <p className="mt-2 font-mono text-xs text-(--muted)">
            {new Date(receivedAt).toLocaleString(locale === 'en' ? 'en-GB' : 'ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'long', timeStyle: 'medium' })}
          </p>
        )}
      </div>
    )
  }

  if (step === 'review') {
    return (
      <div className="border border-(--border) p-6">
        <h2 className="text-lg font-semibold text-(--foreground)">{t('reviewTitle')}</h2>
        <p className="mt-2 text-sm leading-6 text-(--muted)">
          {t('reviewBody', { name: effectiveName, email: effectiveEmail })}
        </p>
        {contractRef && <p className="mt-1 text-sm text-(--muted)">{t('contractLabel')}: {contractRef}</p>}
        {error && <p className="mt-3 text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2">{error}</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => void submit()} disabled={sending}>{t('confirmButton')}</Button>
          <Button variant="secondary" onClick={() => setStep('form')} disabled={sending}>{t('backButton')}</Button>
        </div>
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (canReview) setStep('review')
      }}
    >
      <label className="block text-sm text-(--foreground)">
        {t('nameLabel')}
        <input className={`${inputClass} mt-1`} value={effectiveName} onChange={(e) => setName(e.target.value)} autoComplete="name" required maxLength={120} />
      </label>
      <label className="block text-sm text-(--foreground)">
        {t('emailLabel')}
        <input className={`${inputClass} mt-1`} type="email" value={effectiveEmail} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required maxLength={254} />
      </label>
      <label className="block text-sm text-(--foreground)">
        {t('contractLabel')}
        <input className={`${inputClass} mt-1`} value={contractRef} onChange={(e) => setContractRef(e.target.value)} placeholder={t('contractPlaceholder')} maxLength={200} />
      </label>
      <Button type="submit" disabled={!canReview}>{t('withdrawButton')}</Button>
    </form>
  )
}
