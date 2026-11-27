'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import posthog from 'posthog-js'
import { Button } from '@/components/ui/Button'
import { dismissSurvey, markSurveyShown, saveSurveyAnswer } from '@/lib/onboarding/actions'
import { MAX_SURVEY_TEXT, QUESTION_ORDER, SURVEY_CHOICES, type SurveyQuestion } from '@/lib/signup-survey'

// ph-no-capture keeps autocapture and session recording away from the free text;
// PostHog gets only the explicit events below (no-op without cookie consent).
export function SignupSurveyCard({ answered: initial, shown }: { answered: SurveyQuestion[]; shown: boolean }) {
  const t = useTranslations('Dashboard.signupSurvey')
  const locale = useLocale()
  const [answered, setAnswered] = useState(initial)
  const [closed, setClosed] = useState(false)
  const [otherOpen, setOtherOpen] = useState(false)
  const [text, setText] = useState('')
  const [failed, setFailed] = useState(false)
  const [pending, startTransition] = useTransition()
  const shownSent = useRef(shown)

  useEffect(() => {
    if (shownSent.current) return
    shownSent.current = true
    markSurveyShown(locale)
      .then((first) => {
        if (first) posthog.capture('signup_survey_shown')
      })
      .catch(() => undefined)
  }, [locale])

  if (closed) return null
  const question = QUESTION_ORDER.find((q) => !answered.includes(q))

  const save = (current: SurveyQuestion, choice: string, freeText?: string) => {
    setFailed(false)
    startTransition(async () => {
      const ok = await saveSurveyAnswer(current, choice, freeText).catch(() => false)
      if (!ok) {
        setFailed(true)
        return
      }
      posthog.capture('signup_survey_answered', {
        question: current,
        choice,
        $set: { [`signup_${current}`]: choice },
      })
      setAnswered((previous) => [...previous, current])
      setOtherOpen(false)
      setText('')
    })
  }

  const close = () => {
    setClosed(true)
    if (!question) return
    startTransition(async () => {
      const ok = await dismissSurvey().catch(() => false)
      if (ok) posthog.capture('signup_survey_dismissed', { answered_count: answered.length })
    })
  }

  return (
    <div className="ph-no-capture relative mb-8 rounded-lg border border-border bg-card p-6">
      <button
        type="button"
        onClick={close}
        aria-label={t('close')}
        className="absolute top-4 right-4 text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground"
      >
        <X className="size-5" />
      </button>

      {question ? (
        <>
          <p className="mb-1 text-xs tabular-nums text-muted-foreground">
            {answered.length + 1}/{QUESTION_ORDER.length}
          </p>
          <h3 className="mb-4 pr-8 text-base font-semibold text-foreground">{t(`questions.${question}`)}</h3>
          <div className="flex flex-wrap gap-2">
            {SURVEY_CHOICES[question].map((choice) => (
              <Button
                key={choice}
                type="button"
                variant={choice === 'other' && otherOpen ? 'default' : 'outline'}
                size="sm"
                disabled={pending}
                className="h-auto min-h-8 py-1.5 whitespace-normal"
                onClick={() => (choice === 'other' ? setOtherOpen(true) : save(question, choice))}
              >
                {t(`choices.${question}.${choice}`)}
              </Button>
            ))}
          </div>
          {otherOpen && (
            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault()
                if (!pending) save(question, 'other', text)
              }}
            >
              <input
                autoFocus
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_SURVEY_TEXT}
                aria-label={t('otherPlaceholder')}
                placeholder={t('otherPlaceholder')}
                className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground sm:max-w-md"
              />
              <Button type="submit" size="sm" disabled={pending}>
                {t('save')}
              </Button>
            </form>
          )}
          {failed && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {t('error')}
            </p>
          )}
        </>
      ) : (
        <div role="status" className="pr-8">
          <h3 className="mb-1 text-base font-semibold text-foreground">{t('thanksTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('thanksBody')}</p>
        </div>
      )}
    </div>
  )
}
