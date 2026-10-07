'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { buttonVariants } from '@/components/ui/Button'
import { submitFeedback, type FeedbackResult } from './actions'

const NPS_SCALE = Array.from({ length: 11 }, (_, i) => i) // 0..10

export function FeedbackForm({ email }: { email: string }) {
  const t = useTranslations('Feedback')
  const [likes, setLikes] = useState('')
  const [improvements, setImprovements] = useState('')
  const [nps, setNps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FeedbackResult['status'] | null>(null)
  const [isPending, startTransition] = useTransition()

  // Post-submit terminal states.
  if (result === 'success') {
    return (
      <ConfirmationCard message={t('thanks')} />
    )
  }
  if (result === 'already') {
    return <ConfirmationCard message={t('already')} />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!likes.trim() || !improvements.trim() || nps === null) {
      setError(t('fillAll'))
      return
    }

    startTransition(async () => {
      const res = await submitFeedback({ likes, improvements, nps })
      if (res.status === 'error') {
        setError(res.code === 'signIn' ? t('errors.signIn') : res.code === 'invalid' ? t('fillAll') : t('errors.generic'))
        return
      }
      setResult(res.status)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label={t('likesLabel')} htmlFor="likes">
        <textarea
          id="likes"
          required
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-sm border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) outline-none transition-colors duration-150 ease-out focus:border-(--accent)"
          placeholder={t('likesPlaceholder')}
        />
      </Field>

      <Field label={t('improvementsLabel')} htmlFor="improvements">
        <textarea
          id="improvements"
          required
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-sm border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) outline-none transition-colors duration-150 ease-out focus:border-(--accent)"
          placeholder={t('improvementsPlaceholder')}
        />
      </Field>

      <Field label={t('npsLabel')} htmlFor="nps">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('npsAria')}>
          {NPS_SCALE.map((value) => {
            const selected = nps === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setNps(value)}
                className={`h-10 w-10 rounded-sm border text-sm font-medium transition-colors duration-150 ease-out ${
                  selected
                    ? 'border-(--accent) bg-(--accent) text-(--accent-ink)'
                    : 'border-(--border) bg-(--surface) text-(--foreground)/75 hover:border-(--accent)'
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-(--muted)">
          <span>{t('notLikely')}</span>
          <span>{t('veryLikely')}</span>
        </div>
      </Field>

      <Field label={t('emailLabel')} htmlFor="email">
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-sm border border-(--border) bg-(--surface-elevated) px-3 py-2 text-sm text-(--muted) outline-none"
        />
      </Field>

      {error ? (
        <p className="text-sm text-(--foreground) border-l-2 border-(--foreground) pl-2" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`${buttonVariants('primary', 'md')} w-full disabled:opacity-60`}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-(--foreground)">
        {label}
      </label>
      {children}
    </div>
  )
}

function ConfirmationCard({ message }: { message: string }) {
  return (
    <div className="border border-(--border) bg-(--accent-muted) px-6 py-8 text-center">
      <p className="text-base font-medium text-(--foreground)">{message}</p>
    </div>
  )
}
