'use client'

import { useState, useTransition } from 'react'
import { buttonVariants } from '@/components/ui/Button'
import { submitFeedback, type FeedbackResult } from './actions'

const NPS_SCALE = Array.from({ length: 11 }, (_, i) => i) // 0..10

export function FeedbackForm({ email }: { email: string }) {
  const [likes, setLikes] = useState('')
  const [improvements, setImprovements] = useState('')
  const [nps, setNps] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<FeedbackResult['status'] | null>(null)
  const [isPending, startTransition] = useTransition()

  // Post-submit terminal states.
  if (result === 'success') {
    return (
      <ConfirmationCard message="Thank you! Your feedback has been recorded." />
    )
  }
  if (result === 'already') {
    return <ConfirmationCard message="You've already left feedback — thank you!" />
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!likes.trim() || !improvements.trim() || nps === null) {
      setError('Please fill in every field before submitting.')
      return
    }

    startTransition(async () => {
      const res = await submitFeedback({ likes, improvements, nps })
      if (res.status === 'error') {
        setError(res.message)
        return
      }
      setResult(res.status)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="What do you like about Joben?" htmlFor="likes">
        <textarea
          id="likes"
          required
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) outline-none focus:border-(--accent)"
          placeholder="Tell us what's working well…"
        />
      </Field>

      <Field label="What should be improved?" htmlFor="improvements">
        <textarea
          id="improvements"
          required
          value={improvements}
          onChange={(e) => setImprovements(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-(--border) bg-(--surface) px-3 py-2 text-sm text-(--foreground) outline-none focus:border-(--accent)"
          placeholder="What would make Joben better?"
        />
      </Field>

      <Field label="How likely are you to recommend Joben to a friend?" htmlFor="nps">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Recommendation score from 0 to 10">
          {NPS_SCALE.map((value) => {
            const selected = nps === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setNps(value)}
                className={`h-10 w-10 rounded-lg border text-sm font-medium transition-colors ${
                  selected
                    ? 'border-(--accent) bg-(--accent) text-(--background)'
                    : 'border-(--border) bg-(--surface) text-(--foreground)/75 hover:border-(--accent)'
                }`}
              >
                {value}
              </button>
            )
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-xs text-(--muted)">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
      </Field>

      <Field label="Email" htmlFor="email">
        <input
          id="email"
          type="email"
          value={email}
          readOnly
          className="w-full cursor-not-allowed rounded-lg border border-(--border) bg-(--surface-elevated) px-3 py-2 text-sm text-(--muted) outline-none"
        />
      </Field>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`${buttonVariants('primary', 'md')} w-full disabled:opacity-60`}
      >
        {isPending ? 'Submitting…' : 'Submit feedback'}
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
    <div className="rounded-lg border border-(--accent-strong)/35 bg-(--accent-muted) px-6 py-8 text-center">
      <p className="text-base font-medium text-(--foreground)">{message}</p>
    </div>
  )
}
