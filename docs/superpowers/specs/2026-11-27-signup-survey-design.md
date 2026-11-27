# Own signup survey (replaces the PostHog "Welcome to Joben" popover)

## Why
The PostHog survey (id `01a1720c-6e18-0000-167c-8a795b5b16de`) was shown to 15 people
between 2026-10-25 and 2026-11-17, dismissed by 8 and sent once (probably the owner's
test). We replace it with our own card. Our database holds all the data, and PostHog
receives events so answers can be tied to payments there.

## UI
- Card on `/dashboard`, directly under the greeting. Non-blocking.
- One question at a time with a 1/3 counter. A click on a choice saves it and moves on.
- "Something else" opens a text input (max 200 characters) with a save button.
- After question 3: thank-you message. X closes the card for good.
- A user who leaves halfway resumes at the first unanswered question.
- Shown to every signed-in user who has neither completed nor dismissed it,
  existing accounts included.
- RO and EN copy in `messages/*.json`.
- The card root has the `ph-no-capture` class, so autocapture and session recording
  never pick up the free text. PostHog gets only the explicit events below.

## Questions and stored keys
| Key | Question (EN) | Choice keys |
|---|---|---|
| `source` | Where did you hear about Joben? | reddit, linkedin, friend, google, ai, university, other |
| `intent` | What do you want to do on Joben? | ats_check, rewrite_bullets, english_cv, new_cv, specific_job, other |
| `goal` | What is your goal for the next 30 days? | first_internship, first_job, new_job, interview, other |

Labels and Romanian translations are copied from the PostHog survey.

## Data
`users.onboarding.survey` (existing JSONB column, no migration):

```json
{
  "locale": "ro",
  "shownAt": "ISO",
  "dismissedAt": "ISO",
  "completedAt": "ISO",
  "answers": { "source": { "choice": "other", "text": "...", "at": "ISO" } }
}
```

Account deletion removes the data with the user row.

## PostHog
Captured in the browser with `posthog-js`, so the existing cookie consent applies
(no consent: the database still gets the answer, PostHog gets nothing).

| Event | When | Properties |
|---|---|---|
| `signup_survey_shown` | first time the card appears | none |
| `signup_survey_answered` | after a successful save | `question`, `choice`; `$set`: `signup_<question>` = choice |
| `signup_survey_dismissed` | X before completion | `answered_count` |

Person properties are `signup_source`, `signup_intent`, `signup_goal`. The free text
stays only in the database.

## Code
- `src/lib/signup-survey.ts`: question and choice keys, parsing, input validation,
  pure state updates.
- `src/lib/onboarding/actions.ts`: server actions for shown, answer, dismiss, using the
  existing `readRaw` / `writeRaw`. The user id comes from Clerk `auth()` only.
- `src/components/dashboard/SignupSurveyCard.tsx`: client component.
- `src/app/[locale]/dashboard/page.tsx`: renders the card.
- `src/instrumentation-client.ts`: remove `override_display_language`.

## Errors
- State cannot be read: the card is not rendered.
- A save fails: the user stays on the same question and sees a retry message. The
  survey actions report failure to the caller.
- Buttons are disabled while a save is pending, so answers cannot race each other.
- ponytail: read-modify-write without a row lock, same ceiling as the tours; use
  `jsonb_set` in an RPC if it ever matters.

## Out of scope
Admin page, more surveys, a dedicated table.

## Test
`tests/lib/signup-survey.test.ts`: rejects unknown questions and choices, trims and
caps free text, keeps other `onboarding` keys, completes after the third answer.

## Reading results (Supabase SQL Editor)
```sql
select
  onboarding->'survey'->'answers'->'source'->>'choice' as source,
  onboarding->'survey'->'answers'->'intent'->>'choice' as intent,
  onboarding->'survey'->'answers'->'goal'->>'choice' as goal,
  onboarding->'survey'->'answers'->'source'->>'text' as source_text,
  plan,
  onboarding->'survey'->>'shownAt' as shown_at
from public.users
where onboarding ? 'survey'
order by shown_at desc;
```

## Rollout
Merge and deploy, then stop the PostHog survey (owner confirms). Its single existing
response is not migrated. Check whether the privacy policy needs a line about
voluntary survey answers stored with the account.
