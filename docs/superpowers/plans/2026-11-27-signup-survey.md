# Own Signup Survey Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the PostHog "Welcome to Joben" popover with our own dashboard card that stores answers in the database and mirrors them to PostHog as events.

**Architecture:** Pure helpers in `src/lib/signup-survey.ts` update the `survey` key inside the existing `users.onboarding` JSONB. Server actions next to the tour actions persist it. A client card on `/dashboard` shows one question at a time and captures PostHog events after successful saves.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, next-intl, Clerk, Supabase, posthog-js, Vitest, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-27-signup-survey-design.md`

## Global Constraints

- Work only in the worktree `../joben-signup-survey` (branch `feat/signup-survey`).
- No migration, no new dependency, no `any`.
- User-facing copy: no em dashes, no "X, not Y" phrasing.
- Free text is capped at 200 characters and never sent to PostHog.
- The user id comes from Clerk `auth()` only; every action argument is untrusted.
- Commits are local. Push and PR only when the owner asks.

---

### Task 1: Survey state helpers

**Files:**
- Create: `src/lib/signup-survey.ts`
- Test: `tests/lib/signup-survey.test.ts`

**Interfaces:**
- Produces: `SURVEY_CHOICES`, `QUESTION_ORDER`, `MAX_SURVEY_TEXT`, types `SurveyQuestion`, `SurveyAnswer`, `SurveyState = { answered: SurveyQuestion[]; shown: boolean; closed: boolean }`, functions `parseSurvey(raw)`, `validateAnswer(question, choice, text)`, `withSurveyShown(raw, locale, nowIso)`, `withSurveyAnswer(raw, answer, nowIso)`, `withSurveyDismissed(raw, nowIso)`. `raw` is always the whole `users.onboarding` value.

- [ ] **Step 1: Install dependencies**

Run: `npm ci`
Expected: exit 0.

- [ ] **Step 2: Write the failing test** (`tests/lib/signup-survey.test.ts`)

```ts
import { describe, expect, it } from 'vitest'
import {
  MAX_SURVEY_TEXT,
  parseSurvey,
  validateAnswer,
  withSurveyAnswer,
  withSurveyDismissed,
  withSurveyShown,
} from '@/lib/signup-survey'

describe('validateAnswer', () => {
  it('rejects unknown questions and choices', () => {
    expect(validateAnswer('salary', 'other', undefined)).toBeNull()
    expect(validateAnswer('toString', 'other', undefined)).toBeNull()
    expect(validateAnswer('source', 'tiktok', undefined)).toBeNull()
    expect(validateAnswer('source', 7, undefined)).toBeNull()
  })

  it('trims and caps free text, for "other" only', () => {
    expect(validateAnswer('source', 'other', `  ${'a'.repeat(300)}  `)?.text).toHaveLength(MAX_SURVEY_TEXT)
    expect(validateAnswer('source', 'other', '   ')).toEqual({ question: 'source', choice: 'other' })
    expect(validateAnswer('source', 'reddit', 'x')).toEqual({ question: 'source', choice: 'reddit' })
  })
})

describe('survey state', () => {
  it('starts empty for malformed input', () => {
    const empty = { answered: [], shown: false, closed: false }
    expect(parseSurvey(null)).toEqual(empty)
    expect(parseSurvey({ survey: 'x' })).toEqual(empty)
  })

  it('records the first shown time and locale and keeps other keys', () => {
    const first = withSurveyShown({ tours: { editor: 'a' } }, 'ro', 't1')
    expect(withSurveyShown(first, 'en', 't2')).toEqual({
      tours: { editor: 'a' },
      survey: { shownAt: 't1', locale: 'ro' },
    })
  })

  it('completes after the third answer', () => {
    let raw = withSurveyAnswer({ legacy: true }, { question: 'source', choice: 'google' }, 't1')
    raw = withSurveyAnswer(raw, { question: 'intent', choice: 'new_cv' }, 't2')
    expect(parseSurvey(raw)).toEqual({ answered: ['source', 'intent'], shown: false, closed: false })
    raw = withSurveyAnswer(raw, { question: 'goal', choice: 'other', text: 'abroad' }, 't3')
    expect(raw).toMatchObject({
      legacy: true,
      survey: { completedAt: 't3', answers: { goal: { choice: 'other', text: 'abroad', at: 't3' } } },
    })
    expect(parseSurvey(raw).closed).toBe(true)
  })

  it('closes when dismissed and keeps the answers', () => {
    const raw = withSurveyDismissed(withSurveyAnswer({}, { question: 'source', choice: 'ai' }, 't1'), 't2')
    expect(parseSurvey(raw)).toEqual({ answered: ['source'], shown: false, closed: true })
  })
})
```

- [ ] **Step 3: Run it, expect failure**

Run: `npx vitest run tests/lib/signup-survey.test.ts`
Expected: FAIL, cannot resolve `@/lib/signup-survey`.

- [ ] **Step 4: Implement** (`src/lib/signup-survey.ts`)

```ts
// Signup survey stored in users.onboarding.survey (JSONB). Pure helpers only.
export const SURVEY_CHOICES = {
  source: ['reddit', 'linkedin', 'friend', 'google', 'ai', 'university', 'other'],
  intent: ['ats_check', 'rewrite_bullets', 'english_cv', 'new_cv', 'specific_job', 'other'],
  goal: ['first_internship', 'first_job', 'new_job', 'interview', 'other'],
} as const

export type SurveyQuestion = keyof typeof SURVEY_CHOICES
export const QUESTION_ORDER: readonly SurveyQuestion[] = ['source', 'intent', 'goal']
export const MAX_SURVEY_TEXT = 200

export type SurveyAnswer = { question: SurveyQuestion; choice: string; text?: string }
export type SurveyState = { answered: SurveyQuestion[]; shown: boolean; closed: boolean }

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
}

export function parseSurvey(raw: unknown): SurveyState {
  const survey = asRecord(asRecord(raw).survey)
  const answers = asRecord(survey.answers)
  return {
    answered: QUESTION_ORDER.filter((question) => question in answers),
    shown: typeof survey.shownAt === 'string',
    closed: typeof survey.dismissedAt === 'string' || typeof survey.completedAt === 'string',
  }
}

export function validateAnswer(question: unknown, choice: unknown, text: unknown): SurveyAnswer | null {
  const known = QUESTION_ORDER.find((q) => q === question)
  if (!known || typeof choice !== 'string') return null
  if (!(SURVEY_CHOICES[known] as readonly string[]).includes(choice)) return null
  const clean = choice === 'other' && typeof text === 'string' ? text.trim().slice(0, MAX_SURVEY_TEXT) : ''
  return clean ? { question: known, choice, text: clean } : { question: known, choice }
}

function withSurvey(raw: unknown, patch: Record<string, unknown>): Record<string, unknown> {
  const obj = asRecord(raw)
  return { ...obj, survey: { ...asRecord(obj.survey), ...patch } }
}

export function withSurveyShown(raw: unknown, locale: 'ro' | 'en', nowIso: string): Record<string, unknown> {
  return parseSurvey(raw).shown ? asRecord(raw) : withSurvey(raw, { shownAt: nowIso, locale })
}

export function withSurveyAnswer(raw: unknown, answer: SurveyAnswer, nowIso: string): Record<string, unknown> {
  const { question, ...value } = answer
  const answers = { ...asRecord(asRecord(asRecord(raw).survey).answers), [question]: { ...value, at: nowIso } }
  const complete = QUESTION_ORDER.every((q) => q in answers)
  return withSurvey(raw, complete ? { answers, completedAt: nowIso } : { answers })
}

export function withSurveyDismissed(raw: unknown, nowIso: string): Record<string, unknown> {
  return withSurvey(raw, { dismissedAt: nowIso })
}
```

- [ ] **Step 5: Run it, expect pass**

Run: `npx vitest run tests/lib/signup-survey.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Commit**

```bash
git add src/lib/signup-survey.ts tests/lib/signup-survey.test.ts docs/superpowers TODO.md
git commit -m "feat(survey): signup survey state helpers, spec and plan"
```

---

### Task 2: Server actions

**Files:**
- Modify: `src/lib/onboarding/actions.ts`
- Test: `tests/onboarding-actions.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers, existing `readRaw` / `writeRaw`.
- Produces: `getSurveyState(): Promise<SurveyState | null>` (null = do not render), `markSurveyShown(locale: string): Promise<boolean>` (true only when this call recorded the first view), `saveSurveyAnswer(question: string, choice: string, text?: string): Promise<boolean>`, `dismissSurvey(): Promise<boolean>`.

- [ ] **Step 1: Write failing tests.** In `tests/onboarding-actions.test.ts` replace the action import line with:

```ts
import {
  dismissChecklist,
  dismissSurvey,
  getOnboardingState,
  getSurveyState,
  markSurveyShown,
  markTourSeen,
  saveSurveyAnswer,
} from '@/lib/onboarding/actions'
```

and append:

```ts
describe('signup survey actions', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: {} }, error: null })
  })

  it('hides the card when the read fails or the visitor is signed out', async () => {
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect(await getSurveyState()).toBeNull()
    authMock.mockResolvedValue({ userId: null })
    expect(await getSurveyState()).toBeNull()
  })

  it('saves a valid answer for the caller only', async () => {
    expect(await saveSurveyAnswer('source', 'reddit')).toBe(true)
    expect(eqMock).toHaveBeenCalledWith('clerk_id', 'user_1')
    expect(upsertMock).toHaveBeenCalledWith(
      {
        clerk_id: 'user_1',
        onboarding: { survey: { answers: { source: { choice: 'reddit', at: expect.any(String) } } } },
      },
      { onConflict: 'clerk_id' }
    )
  })

  it('rejects an invalid answer without touching the database', async () => {
    expect(await saveSurveyAnswer('source', 'tiktok')).toBe(false)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('reports a failed write', async () => {
    upsertMock.mockResolvedValue({ error: { message: 'boom' } })
    expect(await saveSurveyAnswer('source', 'reddit')).toBe(false)
    expect(await dismissSurvey()).toBe(false)
  })

  it('reports only the first view', async () => {
    expect(await markSurveyShown('ro')).toBe(true)
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { survey: { shownAt: 'a' } } }, error: null })
    upsertMock.mockClear()
    expect(await markSurveyShown('ro')).toBe(false)
    expect(upsertMock).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run, expect failure**

Run: `npx vitest run tests/onboarding-actions.test.ts`
Expected: new tests FAIL, `getSurveyState is not a function`.

- [ ] **Step 3: Implement.** In `src/lib/onboarding/actions.ts` add the import:

```ts
import {
  parseSurvey,
  validateAnswer,
  withSurveyAnswer,
  withSurveyDismissed,
  withSurveyShown,
  type SurveyState,
} from '@/lib/signup-survey'
```

replace `writeRaw` with a version that reports the result:

```ts
async function writeRaw(userId: string, onboarding: Record<string, unknown>): Promise<boolean> {
  const { error } = await createServerClient()
    .from('users')
    .upsert({ clerk_id: userId, onboarding }, { onConflict: 'clerk_id' })
  if (error) {
    logger.warn('Onboarding state write failed', { source: 'onboarding', userId, error: error.message })
  }
  return !error
}
```

and append:

```ts
// Signup survey (users.onboarding.survey). Next runs one tab's server actions in
// order, so the read-modify-write below cannot race against itself.
async function readOwnRaw(): Promise<{ userId: string; raw: unknown } | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null
    const { raw, failed } = await readRaw(userId)
    return failed ? null : { userId, raw }
  } catch (error) {
    logger.warn('Signup survey read threw', { source: 'signup-survey', error: error instanceof Error ? error.message : String(error) })
    return null
  }
}

export async function getSurveyState(): Promise<SurveyState | null> {
  const own = await readOwnRaw()
  return own ? parseSurvey(own.raw) : null
}

export async function markSurveyShown(locale: string): Promise<boolean> {
  const own = await readOwnRaw()
  if (!own || parseSurvey(own.raw).shown) return false
  return writeRaw(own.userId, withSurveyShown(own.raw, locale === 'en' ? 'en' : 'ro', new Date().toISOString()))
}

export async function saveSurveyAnswer(question: string, choice: string, text?: string): Promise<boolean> {
  const answer = validateAnswer(question, choice, text)
  if (!answer) return false
  const own = await readOwnRaw()
  if (!own) return false
  return writeRaw(own.userId, withSurveyAnswer(own.raw, answer, new Date().toISOString()))
}

export async function dismissSurvey(): Promise<boolean> {
  const own = await readOwnRaw()
  if (!own) return false
  return writeRaw(own.userId, withSurveyDismissed(own.raw, new Date().toISOString()))
}
```

- [ ] **Step 4: Run, expect pass**

Run: `npx vitest run tests/onboarding-actions.test.ts tests/lib/signup-survey.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/onboarding/actions.ts tests/onboarding-actions.test.ts
git commit -m "feat(survey): server actions for the signup survey"
```

---

### Task 3: Dashboard card, copy and cleanup

**Files:**
- Create: `src/components/dashboard/SignupSurveyCard.tsx`
- Modify: `messages/en.json`, `messages/ro.json`, `src/app/[locale]/dashboard/page.tsx`, `src/instrumentation-client.ts`, `TODO.md`
- Test: `tests/lib/signup-survey.test.ts`

**Interfaces:**
- Consumes: Task 1 constants, Task 2 actions.
- Produces: `SignupSurveyCard({ answered, shown }: { answered: SurveyQuestion[]; shown: boolean })`.

- [ ] **Step 1: Write the failing copy test.** Add to the imports of `tests/lib/signup-survey.test.ts`:

```ts
import en from '../../messages/en.json'
import ro from '../../messages/ro.json'
import { QUESTION_ORDER, SURVEY_CHOICES } from '@/lib/signup-survey'
```

and append:

```ts
describe('survey copy', () => {
  it.each([en, ro])('has a label for every question and choice', (messages) => {
    const copy = messages.Dashboard.signupSurvey
    for (const question of QUESTION_ORDER) {
      expect(copy.questions[question]).toBeTruthy()
      expect(Object.keys(copy.choices[question])).toEqual([...SURVEY_CHOICES[question]])
    }
  })
})
```

Run: `npx vitest run tests/lib/signup-survey.test.ts`
Expected: FAIL, `signupSurvey` is undefined.

- [ ] **Step 2: Add copy.** In `messages/en.json`, inside `Dashboard`, between `profileCompletion` and `redeemCode`:

```json
    "signupSurvey": {
      "close": "Dismiss",
      "save": "Save",
      "otherPlaceholder": "Tell us more (optional)",
      "thanksTitle": "Thank you!",
      "thanksBody": "Your answer helps us make Joben more useful.",
      "error": "We could not save your answer. Please try again.",
      "questions": {
        "source": "Where did you hear about Joben?",
        "intent": "What do you want to do on Joben?",
        "goal": "What is your goal for the next 30 days?"
      },
      "choices": {
        "source": {
          "reddit": "Reddit",
          "linkedin": "LinkedIn",
          "friend": "A friend or colleague",
          "google": "Google search",
          "ai": "ChatGPT or another AI",
          "university": "University or career center",
          "other": "Something else"
        },
        "intent": {
          "ats_check": "Check if my resume passes ATS",
          "rewrite_bullets": "Rewrite my resume bullet points",
          "english_cv": "Adapt my resume to English",
          "new_cv": "Build a resume from scratch",
          "specific_job": "Prepare for a specific job",
          "other": "Something else"
        },
        "goal": {
          "first_internship": "My first internship",
          "first_job": "My first job",
          "new_job": "A new job, I already have experience",
          "interview": "I have an interview and I am preparing",
          "other": "Something else"
        }
      }
    },
```

Same place in `messages/ro.json`:

```json
    "signupSurvey": {
      "close": "Închide",
      "save": "Salvează",
      "otherPlaceholder": "Spune-ne mai multe (opțional)",
      "thanksTitle": "Mulțumim!",
      "thanksBody": "Răspunsul tău ne ajută să facem Joben mai util.",
      "error": "Nu am putut salva răspunsul. Încearcă din nou.",
      "questions": {
        "source": "De unde ai auzit de Joben?",
        "intent": "Ce vrei să faci pe Joben?",
        "goal": "Care e obiectivul tău în următoarele 30 de zile?"
      },
      "choices": {
        "source": {
          "reddit": "Reddit",
          "linkedin": "LinkedIn",
          "friend": "Un prieten sau coleg",
          "google": "Căutare Google",
          "ai": "ChatGPT sau alt AI",
          "university": "Universitate sau centru de carieră",
          "other": "Altceva"
        },
        "intent": {
          "ats_check": "Să verific dacă CV-ul meu trece de ATS",
          "rewrite_bullets": "Să-mi rescriu punctele din CV",
          "english_cv": "Să-mi adaptez CV-ul în engleză",
          "new_cv": "Să creez un CV de la zero",
          "specific_job": "Să mă pregătesc pentru un job anume",
          "other": "Altceva"
        },
        "goal": {
          "first_internship": "Primul internship",
          "first_job": "Primul job",
          "new_job": "Un job nou, am deja experiență",
          "interview": "Am un interviu și mă pregătesc",
          "other": "Altceva"
        }
      }
    },
```

Run: `npx vitest run tests/lib/signup-survey.test.ts`
Expected: PASS.

- [ ] **Step 3: Create the card** (`src/components/dashboard/SignupSurveyCard.tsx`)

```tsx
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
                save(question, 'other', text)
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
```

- [ ] **Step 4: Render it.** In `src/app/[locale]/dashboard/page.tsx`:

Add the import and extend the actions import:

```tsx
import { SignupSurveyCard } from '@/components/dashboard/SignupSurveyCard'
import { getOnboardingState, getSurveyState } from '@/lib/onboarding/actions'
```

After `const onboarding = await getOnboardingState()`:

```tsx
  const survey = await getSurveyState()
```

Directly before `{isNewUser && user?.id && <MobileHandoffCard />}`:

```tsx
          {survey && !survey.closed && <SignupSurveyCard answered={survey.answered} shown={survey.shown} />}
```

- [ ] **Step 5: Cleanup.** In `src/instrumentation-client.ts` delete these two lines:

```ts
    // Survey copy follows the site locale (/en or /ro), not the browser language.
    override_display_language: window.location.pathname.startsWith('/en') ? 'en' : 'ro',
```

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit`, then `npm run lint`, then `npm test`
Expected: all exit 0.

- [ ] **Step 7: Update `TODO.md`** (the 2026-11-27 line): code ready on `feat/signup-survey`; owner still has to test on the dashboard, merge, then stop the PostHog survey and check the privacy policy wording.

- [ ] **Step 8: Commit**

```bash
git add src messages tests TODO.md
git commit -m "feat(survey): own signup survey card on the dashboard"
```

---

### After merge (owner confirms)

- [ ] Stop survey `01a1720c-6e18-0000-167c-8a795b5b16de` in PostHog.
- [ ] On joben.eu: answer the card, check the row with the SQL from the spec and the three `signup_survey_*` events in PostHog (events are sent from joben.eu only).
