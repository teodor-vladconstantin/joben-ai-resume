# Onboarding Tours and Activation Checklist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guide new users through every authenticated section with a spotlight tour per section, plus an activation checklist in the dashboard that ends at the first exported PDF.

**Architecture:** A typed registry of tours (`src/lib/onboarding/tours.ts`) is driven by `driver.js` inside a client `TourLauncher` mounted in each section. Anchors are `data-tour="..."` attributes on real elements. State lives in `users.onboarding` (JSONB) and is read and written through server actions. `ProfileCompletion` becomes the checklist.

**Tech Stack:** Next.js 16 App Router, React 19.2, TypeScript strict, next-intl (RO and EN), Supabase (service role server-side only), Clerk, PostHog (`posthog-js`), `driver.js` 1.10.2, Tailwind 4 with CSS variables, vitest (node environment, files `tests/**/*.test.ts`).

## Global Constraints

Copied from the spec; every task includes these.

- Tours run only at 1024 px and wider (`matchMedia('(min-width: 1024px)')`). Below that, nothing renders; the existing `MobileHandoffCard` stays the phone path.
- Anchors are `data-tour="..."` attributes. Class names and DOM structure are never used as selectors.
- State is `users.onboarding jsonb not null default '{}'`. Existing users get `{"legacy": true}` in the migration and never auto-start a tour; they can start any tour from the "?" button.
- No service role key reaches the client. Writes go through server actions that read identity from Clerk `auth()` and touch only the caller's row.
- `driver.js` is imported dynamically (`await import('driver.js')`); only its CSS is a static import.
- Popover styling uses the existing CSS variables (`--surface`, `--foreground`, `--muted`, `--accent`, `--accent-ink`, `--border`, `--surface-elevated`) so dark and light themes both work.
- Copy lives in `messages/ro.json` and `messages/en.json` under `Onboarding`, with identical key sets. No em dashes in user-facing text; no "X, not Y" phrasing.
- The tour never blocks the user: Esc and the close button always stop it, missing anchors are skipped, a failed state write is swallowed.
- PostHog events from the launcher, all with `tourId`: `tour_started` (`trigger: 'auto' | 'manual'`), `tour_step_viewed` (`stepIndex`), `tour_completed`, `tour_skipped` (`stepIndex`).
- After each task: `npx tsc --noEmit`, `npm run lint`, `npm test` stay green. TypeScript strict, no `any`. Imports ordered React, Next, third-party, local (`@/`).
- Line endings: many files in this repo use CRLF. If an `Edit` with a multi-line match fails for that reason, use the helper in Task 0 Step 3.

---

### Task 0: Branch, TODO entry, edit helper

**Files:**
- Modify: `TODO.md`
- Create (not committed): `$TEMP/replace.mjs`

- [ ] **Step 1: Create the feature branch on top of the design branch**

The spec and this plan are committed on `docs/onboarding-tours-design`, so the feature branch starts there (the docs commits ride along in the PR).

```bash
cd /c/Users/const/OneDrive/Documents/GitHub/joben-ai-resume
git checkout -q docs/onboarding-tours-design
git checkout -q -b feat/onboarding-tours
git branch --show-current
```
Expected: `feat/onboarding-tours`.

- [ ] **Step 2: Add the TODO entry**

In `TODO.md`, under `## Active`, add as the first line:

```markdown
- [IN PROGRESS] 2026-10-25 Onboarding: tururi driver.js per secțiune (dashboard, CV-uri, editor, scrisori, AI Review) + checklist de activare, stare în users.onboarding. Spec: docs/superpowers/specs/2026-10-25-onboarding-tours-design.md, plan: docs/superpowers/plans/2026-10-25-onboarding-tours.md.
```

- [ ] **Step 3: Create the multi-line replace helper (kept outside the repo)**

```bash
cat > "$TEMP/replace.mjs" <<'EOF'
// usage: node replace.mjs <file> <oldFile> <newFile>  (old/new are text files, LF)
import fs from 'node:fs'
const [file, oldFile, newFile] = process.argv.slice(2)
const raw = fs.readFileSync(file, 'utf8')
const crlf = raw.includes('\r\n')
let text = raw.replace(/\r\n/g, '\n')
const oldText = fs.readFileSync(oldFile, 'utf8').replace(/\n$/, '')
const newText = fs.readFileSync(newFile, 'utf8').replace(/\n$/, '')
const count = text.split(oldText).length - 1
if (count !== 1) { console.error(`expected exactly 1 match, found ${count}`); process.exit(1) }
text = text.replace(oldText, () => newText)
fs.writeFileSync(file, crlf ? text.replace(/\n/g, '\r\n') : text)
EOF
```

- [ ] **Step 4: Commit**

```bash
git add TODO.md
git commit -m "docs(todo): onboarding tours in progress

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 1: Onboarding state helpers and migration

**Files:**
- Create: `src/lib/onboarding/state.ts`
- Create: `supabase/migrations/20261025130000_add_users_onboarding.sql`
- Test: `tests/onboarding-state.test.ts`

**Interfaces:**
- Produces (used by every later task):
  - `TOUR_IDS`, `type TourId = 'dashboard' | 'resumes' | 'editor' | 'coverLetters' | 'aiReview'`
  - `type OnboardingState = { legacy: boolean; tours: Partial<Record<TourId, string>>; checklistDismissedAt: string | null }`
  - `NO_TOUR_STATE: OnboardingState` (legacy true, never starts a tour)
  - `isTourId(value: unknown): value is TourId`
  - `parseOnboarding(raw: unknown): OnboardingState`
  - `withTourSeen(raw: unknown, tourId: TourId, nowIso: string): Record<string, unknown>` (keeps the first timestamp if the tour was already seen, keeps unknown keys)
  - `withChecklistDismissed(raw: unknown, nowIso: string): Record<string, unknown>`
  - `shouldAutoStart(input: { state: OnboardingState; tourId: TourId; isDesktop: boolean }): boolean`

- [ ] **Step 1: Write the failing test**

Create `tests/onboarding-state.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  NO_TOUR_STATE,
  TOUR_IDS,
  isTourId,
  parseOnboarding,
  shouldAutoStart,
  withChecklistDismissed,
  withTourSeen,
} from '@/lib/onboarding/state'

describe('isTourId', () => {
  it('accepts every registered id and rejects anything else', () => {
    for (const id of TOUR_IDS) expect(isTourId(id)).toBe(true)
    expect(isTourId('settings')).toBe(false)
    expect(isTourId(undefined)).toBe(false)
    expect(isTourId(7)).toBe(false)
  })
})

describe('parseOnboarding', () => {
  it('returns a clean default for empty or malformed input', () => {
    const empty = { legacy: false, tours: {}, checklistDismissedAt: null }
    expect(parseOnboarding({})).toEqual(empty)
    expect(parseOnboarding(null)).toEqual(empty)
    expect(parseOnboarding('x')).toEqual(empty)
    expect(parseOnboarding([1])).toEqual(empty)
  })

  it('keeps valid fields and drops unknown tour ids and non-string values', () => {
    const parsed = parseOnboarding({
      legacy: true,
      tours: { dashboard: '2026-10-25T10:00:00Z', ghost: '2026-10-25T10:00:00Z', editor: 5 },
      checklistDismissedAt: '2026-10-25T11:00:00Z',
    })
    expect(parsed).toEqual({
      legacy: true,
      tours: { dashboard: '2026-10-25T10:00:00Z' },
      checklistDismissedAt: '2026-10-25T11:00:00Z',
    })
  })
})

describe('withTourSeen', () => {
  it('adds the tour and keeps unrelated keys', () => {
    const next = withTourSeen({ legacy: false, extra: 1, tours: { dashboard: 'a' } }, 'editor', 'now')
    expect(next).toEqual({ legacy: false, extra: 1, tours: { dashboard: 'a', editor: 'now' } })
  })

  it('keeps the first timestamp when the tour was already seen', () => {
    const next = withTourSeen({ tours: { dashboard: 'first' } }, 'dashboard', 'second')
    expect(next).toEqual({ tours: { dashboard: 'first' } })
  })

  it('works from null', () => {
    expect(withTourSeen(null, 'resumes', 'now')).toEqual({ tours: { resumes: 'now' } })
  })
})

describe('withChecklistDismissed', () => {
  it('sets the timestamp and keeps the rest', () => {
    expect(withChecklistDismissed({ tours: { dashboard: 'a' } }, 'now')).toEqual({
      tours: { dashboard: 'a' },
      checklistDismissedAt: 'now',
    })
  })
})

describe('shouldAutoStart', () => {
  const fresh = parseOnboarding({})

  it('starts for a new user on desktop who has not seen the tour', () => {
    expect(shouldAutoStart({ state: fresh, tourId: 'dashboard', isDesktop: true })).toBe(true)
  })

  it('does not start on small screens', () => {
    expect(shouldAutoStart({ state: fresh, tourId: 'dashboard', isDesktop: false })).toBe(false)
  })

  it('does not start for legacy users or the unreadable-state fallback', () => {
    expect(shouldAutoStart({ state: parseOnboarding({ legacy: true }), tourId: 'dashboard', isDesktop: true })).toBe(false)
    expect(shouldAutoStart({ state: NO_TOUR_STATE, tourId: 'dashboard', isDesktop: true })).toBe(false)
  })

  it('does not start a tour that was already seen, but starts the others', () => {
    const state = parseOnboarding({ tours: { dashboard: 'a' } })
    expect(shouldAutoStart({ state, tourId: 'dashboard', isDesktop: true })).toBe(false)
    expect(shouldAutoStart({ state, tourId: 'editor', isDesktop: true })).toBe(true)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/onboarding-state.test.ts`
Expected: FAIL, "Failed to resolve import @/lib/onboarding/state".

- [ ] **Step 3: Write the implementation**

Create `src/lib/onboarding/state.ts`:

```ts
// Onboarding state stored in users.onboarding (JSONB). Pure helpers only, so
// they can be unit-tested and shared by server actions and client components.
export const TOUR_IDS = ['dashboard', 'resumes', 'editor', 'coverLetters', 'aiReview'] as const
export type TourId = (typeof TOUR_IDS)[number]

export type OnboardingState = {
  legacy: boolean
  tours: Partial<Record<TourId, string>>
  checklistDismissedAt: string | null
}

// Returned when the visitor is signed out or the state cannot be read: it never
// starts a tour, so a database error cannot spam anyone with one.
export const NO_TOUR_STATE: OnboardingState = { legacy: true, tours: {}, checklistDismissedAt: null }

export function isTourId(value: unknown): value is TourId {
  return typeof value === 'string' && (TOUR_IDS as readonly string[]).includes(value)
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
}

export function parseOnboarding(raw: unknown): OnboardingState {
  const obj = asRecord(raw)
  const tours: OnboardingState['tours'] = {}
  for (const [key, value] of Object.entries(asRecord(obj.tours))) {
    if (isTourId(key) && typeof value === 'string') tours[key] = value
  }
  return {
    legacy: obj.legacy === true,
    tours,
    checklistDismissedAt: typeof obj.checklistDismissedAt === 'string' ? obj.checklistDismissedAt : null,
  }
}

// Read-modify-write on one JSONB value. ponytail: no row lock, two tabs finishing
// two different tours in the same instant could lose one mark (the tour would
// show once more); use jsonb_set in an RPC if that ever matters.
export function withTourSeen(raw: unknown, tourId: TourId, nowIso: string): Record<string, unknown> {
  const obj = asRecord(raw)
  const tours = asRecord(obj.tours)
  return { ...obj, tours: { ...tours, [tourId]: typeof tours[tourId] === 'string' ? tours[tourId] : nowIso } }
}

export function withChecklistDismissed(raw: unknown, nowIso: string): Record<string, unknown> {
  return { ...asRecord(raw), checklistDismissedAt: nowIso }
}

export function shouldAutoStart(input: { state: OnboardingState; tourId: TourId; isDesktop: boolean }): boolean {
  return input.isDesktop && !input.state.legacy && !input.state.tours[input.tourId]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/onboarding-state.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Write the migration**

Create `supabase/migrations/20261025130000_add_users_onboarding.sql`:

```sql
alter table public.users
  add column if not exists onboarding jsonb not null default '{}'::jsonb;

-- Everyone who exists today skips automatic tours; they can start any tour
-- from the "?" button. Only accounts created after this runs get them.
update public.users
set onboarding = '{"legacy": true}'::jsonb
where onboarding = '{}'::jsonb;
```

- [ ] **Step 6: Review the migration (do not apply it yet)**

Dispatch the `migration-reviewer` agent on `supabase/migrations/20261025130000_add_users_onboarding.sql` and fix anything it flags. Applying to production happens in Task 9 and needs the owner's go-ahead.

- [ ] **Step 7: Type-check and commit**

```bash
npx tsc --noEmit
git add src/lib/onboarding/state.ts tests/onboarding-state.test.ts supabase/migrations/20261025130000_add_users_onboarding.sql
git commit -m "feat(onboarding): state helpers and users.onboarding migration

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: `tsc` prints nothing.

---

### Task 2: Server actions

**Files:**
- Create: `src/lib/onboarding/actions.ts`
- Test: `tests/onboarding-actions.test.ts`

**Interfaces:**
- Consumes: `NO_TOUR_STATE`, `isTourId`, `parseOnboarding`, `withTourSeen`, `withChecklistDismissed`, `OnboardingState` from Task 1.
- Produces (client and server callable):
  - `getOnboardingState(): Promise<OnboardingState>`
  - `markTourSeen(tourId: string): Promise<void>`
  - `dismissChecklist(): Promise<void>`

- [ ] **Step 1: Write the failing test**

Create `tests/onboarding-actions.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authMock, maybeSingleMock, upsertMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  maybeSingleMock: vi.fn(),
  upsertMock: vi.fn(),
}))

vi.mock('@clerk/nextjs/server', () => ({ auth: authMock }))
vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))
vi.mock('@/lib/supabase/server', () => ({
  createServerClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: maybeSingleMock }) }),
      upsert: upsertMock,
    }),
  }),
}))

import { dismissChecklist, getOnboardingState, markTourSeen } from '@/lib/onboarding/actions'

beforeEach(() => {
  authMock.mockReset()
  maybeSingleMock.mockReset()
  upsertMock.mockReset()
  upsertMock.mockResolvedValue({ error: null })
})

describe('getOnboardingState', () => {
  it('returns the never-start state for a signed-out visitor', async () => {
    authMock.mockResolvedValue({ userId: null })
    const state = await getOnboardingState()
    expect(state.legacy).toBe(true)
    expect(maybeSingleMock).not.toHaveBeenCalled()
  })

  it('parses the stored JSON', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    expect(await getOnboardingState()).toEqual({ legacy: false, tours: { editor: 'a' }, checklistDismissedAt: null })
  })

  it('treats a missing row as a brand-new user', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: null })
    expect((await getOnboardingState()).legacy).toBe(false)
  })

  it('never starts a tour when the read fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    expect((await getOnboardingState()).legacy).toBe(true)
  })
})

describe('markTourSeen', () => {
  it('ignores an unknown tour id without touching the database', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    await markTourSeen('settings')
    expect(maybeSingleMock).not.toHaveBeenCalled()
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('does nothing for a signed-out visitor', async () => {
    authMock.mockResolvedValue({ userId: null })
    await markTourSeen('dashboard')
    expect(upsertMock).not.toHaveBeenCalled()
  })

  it('writes the merged JSON for the caller only', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    await markTourSeen('dashboard')
    expect(upsertMock).toHaveBeenCalledWith(
      { clerk_id: 'user_1', onboarding: { tours: { editor: 'a', dashboard: expect.any(String) } } },
      { onConflict: 'clerk_id' }
    )
  })

  it('does not write when the read failed', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    await markTourSeen('dashboard')
    expect(upsertMock).not.toHaveBeenCalled()
  })
})

describe('dismissChecklist', () => {
  it('stores the dismissal time and keeps the tours', async () => {
    authMock.mockResolvedValue({ userId: 'user_1' })
    maybeSingleMock.mockResolvedValue({ data: { onboarding: { tours: { editor: 'a' } } }, error: null })
    await dismissChecklist()
    expect(upsertMock).toHaveBeenCalledWith(
      { clerk_id: 'user_1', onboarding: { tours: { editor: 'a' }, checklistDismissedAt: expect.any(String) } },
      { onConflict: 'clerk_id' }
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/onboarding-actions.test.ts`
Expected: FAIL, "Failed to resolve import @/lib/onboarding/actions".

- [ ] **Step 3: Write the implementation**

Create `src/lib/onboarding/actions.ts`:

```ts
'use server'

import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import {
  NO_TOUR_STATE,
  isTourId,
  parseOnboarding,
  withChecklistDismissed,
  withTourSeen,
  type OnboardingState,
} from '@/lib/onboarding/state'

async function readRaw(userId: string): Promise<{ raw: unknown; failed: boolean }> {
  const { data, error } = await createServerClient()
    .from('users')
    .select('onboarding')
    .eq('clerk_id', userId)
    .maybeSingle()
  if (error) {
    logger.warn('Onboarding state read failed', { source: 'onboarding', userId, error: error.message })
    return { raw: null, failed: true }
  }
  return { raw: data?.onboarding ?? null, failed: false }
}

// Upsert on clerk_id: right after sign-up the Clerk webhook may not have created
// the users row yet. The webhook's own upsert never sets `onboarding`.
async function writeRaw(userId: string, onboarding: Record<string, unknown>): Promise<void> {
  const { error } = await createServerClient()
    .from('users')
    .upsert({ clerk_id: userId, onboarding }, { onConflict: 'clerk_id' })
  if (error) {
    logger.warn('Onboarding state write failed', { source: 'onboarding', userId, error: error.message })
  }
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const { userId } = await auth()
  if (!userId) return NO_TOUR_STATE
  const { raw, failed } = await readRaw(userId)
  return failed ? NO_TOUR_STATE : parseOnboarding(raw)
}

export async function markTourSeen(tourId: string): Promise<void> {
  if (!isTourId(tourId)) return
  const { userId } = await auth()
  if (!userId) return
  const { raw, failed } = await readRaw(userId)
  if (failed) return
  await writeRaw(userId, withTourSeen(raw, tourId, new Date().toISOString()))
}

export async function dismissChecklist(): Promise<void> {
  const { userId } = await auth()
  if (!userId) return
  const { raw, failed } = await readRaw(userId)
  if (failed) return
  await writeRaw(userId, withChecklistDismissed(raw, new Date().toISOString()))
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/onboarding-actions.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Type-check, lint and commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/onboarding/actions.ts tests/onboarding-actions.test.ts
git commit -m "feat(onboarding): server actions for tour and checklist state

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: no errors (the existing `isRo` warning in `social-listening.ts` is fine).

---

### Task 3: Tour registry, step resolver and copy

**Files:**
- Create: `src/lib/onboarding/tours.ts`
- Create: `src/lib/onboarding/steps.ts`
- Modify: `messages/en.json`, `messages/ro.json` (new top-level `Onboarding` block, inserted before `"Dashboard"`)
- Test: `tests/onboarding-tours.test.ts`

**Interfaces:**
- Consumes: `TourId`, `TOUR_IDS` from Task 1.
- Produces:
  - `type TourStep = { anchor: string; key: string }`
  - `TOURS: Record<TourId, TourStep[]>` in `tours.ts`
  - `selectorFor(anchor: string): string` and `resolveSteps(steps: TourStep[], hasAnchor: (anchor: string) => boolean): TourStep[]` in `steps.ts`
  - Message keys: `Onboarding.ui.{next,prev,done,help}`, `Onboarding.tours.<tourId>.<stepKey>.{title,body}`

- [ ] **Step 1: Write the failing test**

Create `tests/onboarding-tours.test.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { TOUR_IDS } from '@/lib/onboarding/state'
import { TOURS } from '@/lib/onboarding/tours'
import { resolveSteps, selectorFor } from '@/lib/onboarding/steps'

type Json = { [key: string]: Json | string }

function loadMessages(locale: 'en' | 'ro'): Json {
  return JSON.parse(readFileSync(join(process.cwd(), 'messages', `${locale}.json`), 'utf8')) as Json
}

function leafPaths(node: Json | string, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix]
  return Object.entries(node).flatMap(([key, value]) => leafPaths(value, prefix ? `${prefix}.${key}` : key))
}

function pick(root: Json, path: string): string | undefined {
  let node: Json | string | undefined = root
  for (const part of path.split('.')) {
    if (node === undefined || typeof node === 'string') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

describe('tour registry', () => {
  it('has a non-empty tour for every tour id', () => {
    for (const id of TOUR_IDS) expect(TOURS[id].length).toBeGreaterThan(0)
  })

  it('uses unique anchors across all tours', () => {
    const anchors = TOUR_IDS.flatMap((id) => TOURS[id].map((step) => step.anchor))
    expect(new Set(anchors).size).toBe(anchors.length)
  })

  it('has a title and a body in both locales for every step', () => {
    for (const locale of ['en', 'ro'] as const) {
      const messages = loadMessages(locale)
      for (const id of TOUR_IDS) {
        for (const step of TOURS[id]) {
          for (const field of ['title', 'body']) {
            const text = pick(messages, `Onboarding.tours.${id}.${step.key}.${field}`)
            expect(text, `${locale} ${id}.${step.key}.${field}`).toBeTruthy()
          }
        }
      }
    }
  })

  it('keeps the Onboarding key sets identical in en and ro and free of em dashes', () => {
    const en = loadMessages('en').Onboarding as Json
    const ro = loadMessages('ro').Onboarding as Json
    expect(leafPaths(ro).sort()).toEqual(leafPaths(en).sort())
    expect(JSON.stringify(en) + JSON.stringify(ro)).not.toContain('—')
  })
})

describe('resolveSteps', () => {
  const steps = [
    { anchor: 'a', key: 'one' },
    { anchor: 'b', key: 'two' },
    { anchor: 'c', key: 'three' },
  ]

  it('keeps only steps whose anchor exists, in order', () => {
    expect(resolveSteps(steps, (anchor) => anchor !== 'b').map((s) => s.key)).toEqual(['one', 'three'])
  })

  it('returns an empty list when nothing exists', () => {
    expect(resolveSteps(steps, () => false)).toEqual([])
  })
})

describe('selectorFor', () => {
  it('targets the data-tour attribute', () => {
    expect(selectorFor('dashboard-sidebar')).toBe('[data-tour="dashboard-sidebar"]')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/onboarding-tours.test.ts`
Expected: FAIL, "Failed to resolve import @/lib/onboarding/tours".

- [ ] **Step 3: Write the registry and the resolver**

Create `src/lib/onboarding/tours.ts`:

```ts
import type { TourId } from '@/lib/onboarding/state'

// anchor: value of the data-tour attribute on the real element.
// key: message key under Onboarding.tours.<tourId>.<key>.{title,body}.
export type TourStep = { anchor: string; key: string }

export const TOURS: Record<TourId, TourStep[]> = {
  dashboard: [
    { anchor: 'dashboard-sidebar', key: 'sidebar' },
    { anchor: 'dashboard-create', key: 'create' },
    { anchor: 'dashboard-checklist', key: 'checklist' },
    { anchor: 'dashboard-ats', key: 'ats' },
    { anchor: 'dashboard-referral', key: 'referral' },
  ],
  resumes: [
    { anchor: 'resumes-create', key: 'create' },
    { anchor: 'resumes-row', key: 'row' },
    { anchor: 'resumes-actions', key: 'actions' },
  ],
  editor: [
    { anchor: 'editor-tabs', key: 'tabs' },
    { anchor: 'editor-import', key: 'import' },
    { anchor: 'editor-tailor', key: 'tailor' },
    { anchor: 'editor-preview', key: 'preview' },
    { anchor: 'editor-export', key: 'export' },
  ],
  coverLetters: [
    { anchor: 'letters-create', key: 'create' },
    { anchor: 'letters-row', key: 'row' },
    { anchor: 'letters-actions', key: 'actions' },
  ],
  aiReview: [
    { anchor: 'ai-upload', key: 'upload' },
    { anchor: 'ai-jd', key: 'jd' },
    { anchor: 'ai-start', key: 'start' },
    { anchor: 'ai-history', key: 'history' },
  ],
}
```

Create `src/lib/onboarding/steps.ts`:

```ts
import type { TourStep } from '@/lib/onboarding/tours'

export function selectorFor(anchor: string): string {
  return `[data-tour="${anchor}"]`
}

// Steps whose element is not on the page (an empty list has no first row, the
// ATS card only exists after a claimed scan) are skipped instead of breaking the tour.
export function resolveSteps(steps: TourStep[], hasAnchor: (anchor: string) => boolean): TourStep[] {
  return steps.filter((step) => hasAnchor(step.anchor))
}
```

- [ ] **Step 4: Add the English copy**

In `messages/en.json`, insert this block immediately before the line `  "Dashboard": {`:

```json
  "Onboarding": {
    "ui": {
      "next": "Next",
      "prev": "Back",
      "done": "Done",
      "help": "Show the guide for this page"
    },
    "tours": {
      "dashboard": {
        "sidebar": { "title": "Your navigation", "body": "Resumes, cover letters, AI Review and settings are one click away from here." },
        "create": { "title": "Start a new resume", "body": "Begin with a blank resume or import an existing PDF inside the editor." },
        "checklist": { "title": "Your first steps", "body": "Complete these four steps and you have a finished, exported resume. Each step links to the right page." },
        "ats": { "title": "Your free ATS scan", "body": "The score and issues from your scan are saved here. Open the editor to fix them with AI." },
        "referral": { "title": "Invite friends", "body": "Share your link: you get 7 Pro days for every friend who joins and confirms their email." }
      },
      "resumes": {
        "create": { "title": "Create a resume", "body": "Start a new resume from here. You can import an existing PDF in the editor." },
        "row": { "title": "Your resumes", "body": "Each row shows the title, the last update and the score of a resume." },
        "actions": { "title": "Open, edit or delete", "body": "The eye and the pencil open the resume in the editor, the bin deletes it." }
      },
      "editor": {
        "tabs": { "title": "Resume sections", "body": "Fill in each tab: personal details, experience, education, skills and more." },
        "import": { "title": "Import a PDF", "body": "Already have a resume? Import it and the fields fill themselves." },
        "tailor": { "title": "Tailor it to a job", "body": "Paste a job posting and AI suggests changes that match it." },
        "preview": { "title": "Live preview", "body": "This is the page employers see. It updates as you type." },
        "export": { "title": "Save and export", "body": "Save your work, then export a PDF ready to send." }
      },
      "coverLetters": {
        "create": { "title": "Create a cover letter", "body": "Start a new cover letter from here." },
        "row": { "title": "Your cover letters", "body": "Each row shows the title and the last update of a letter." },
        "actions": { "title": "Open, edit or delete", "body": "The eye and the pencil open the letter, the bin deletes it." }
      },
      "aiReview": {
        "upload": { "title": "Upload a resume", "body": "Drop a PDF here to review it without saving it as a resume first." },
        "jd": { "title": "Add the job description", "body": "Optional. With a posting pasted here, the review also checks how well you match it." },
        "start": { "title": "Run the review", "body": "You get a score with concrete fixes." },
        "history": { "title": "Your resumes and past reviews", "body": "Review any saved resume, reopen the latest result, or run it again after you improve it." }
      }
    }
  },
```

- [ ] **Step 5: Add the Romanian copy**

In `messages/ro.json`, insert this block immediately before the line `  "Dashboard": {`:

```json
  "Onboarding": {
    "ui": {
      "next": "Înainte",
      "prev": "Înapoi",
      "done": "Gata",
      "help": "Arată ghidul pentru această pagină"
    },
    "tours": {
      "dashboard": {
        "sidebar": { "title": "Navigarea ta", "body": "De aici ajungi dintr-un click la CV-uri, scrisori, AI Review și setări." },
        "create": { "title": "Începe un CV nou", "body": "Pornești de la un CV gol sau imporți un PDF existent direct în editor." },
        "checklist": { "title": "Primii tăi pași", "body": "Parcurge cei patru pași și ai un CV gata, exportat. Fiecare pas te duce la pagina potrivită." },
        "ats": { "title": "Scanarea ta ATS gratuită", "body": "Scorul și problemele găsite sunt salvate aici. Deschide editorul ca să le repari cu AI." },
        "referral": { "title": "Invită prieteni", "body": "Trimite linkul tău: primești 7 zile Pro pentru fiecare prieten care își face cont și își confirmă emailul." }
      },
      "resumes": {
        "create": { "title": "Creează un CV", "body": "Pornești un CV nou de aici. În editor poți importa un PDF existent." },
        "row": { "title": "CV-urile tale", "body": "Fiecare rând arată titlul, ultima modificare și scorul unui CV." },
        "actions": { "title": "Deschide, editează sau șterge", "body": "Ochiul și creionul deschid CV-ul în editor, coșul îl șterge." }
      },
      "editor": {
        "tabs": { "title": "Secțiunile CV-ului", "body": "Completează fiecare tab: date personale, experiență, educație, abilități și altele." },
        "import": { "title": "Importă un PDF", "body": "Ai deja un CV? Importă-l și câmpurile se completează singure." },
        "tailor": { "title": "Adaptează-l la un job", "body": "Lipești un anunț și AI propune modificări potrivite cu el." },
        "preview": { "title": "Previzualizare live", "body": "Asta văd angajatorii. Se actualizează pe măsură ce scrii." },
        "export": { "title": "Salvează și exportă", "body": "Salvează ce ai făcut, apoi exportă un PDF gata de trimis." }
      },
      "coverLetters": {
        "create": { "title": "Creează o scrisoare de intenție", "body": "Pornești o scrisoare nouă de aici." },
        "row": { "title": "Scrisorile tale", "body": "Fiecare rând arată titlul și ultima modificare a unei scrisori." },
        "actions": { "title": "Deschide, editează sau șterge", "body": "Ochiul și creionul deschid scrisoarea, coșul o șterge." }
      },
      "aiReview": {
        "upload": { "title": "Încarcă un CV", "body": "Aruncă aici un PDF ca să-l evaluezi fără să-l salvezi mai întâi ca CV." },
        "jd": { "title": "Adaugă descrierea jobului", "body": "Opțional. Cu un anunț lipit aici, evaluarea verifică și cât de bine te potrivești cu el." },
        "start": { "title": "Pornește evaluarea", "body": "Primești un scor cu îmbunătățiri concrete." },
        "history": { "title": "CV-urile tale și evaluările anterioare", "body": "Evaluează orice CV salvat, redeschide ultimul rezultat sau rulează din nou după ce îl îmbunătățești." }
      }
    }
  },
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/onboarding-tours.test.ts`
Expected: PASS, 7 tests. If JSON parsing fails, check the trailing comma after the inserted block.

- [ ] **Step 7: Type-check, lint and commit**

```bash
npx tsc --noEmit && npm run lint
git add src/lib/onboarding/tours.ts src/lib/onboarding/steps.ts messages/en.json messages/ro.json tests/onboarding-tours.test.ts
git commit -m "feat(onboarding): tour registry, step resolver and RO/EN copy

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: driver.js, TourLauncher and theme

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `src/components/onboarding/TourLauncher.tsx`
- Modify: `src/app/[locale]/globals.css` (append a block)

**Interfaces:**
- Consumes: `getOnboardingState`, `markTourSeen` (Task 2); `TOURS`, `resolveSteps`, `selectorFor` (Task 3); `shouldAutoStart`, `OnboardingState`, `TourId` (Task 1).
- Produces: `TourLauncher({ tourId }: { tourId: TourId })`, a client component. Renders nothing below 1024 px; on desktop renders the fixed "?" button and auto-starts an unseen tour 3 s after the state loads.

- [ ] **Step 1: Install driver.js**

```bash
npm install driver.js@1.10.2 --save-exact=false
node -e "console.log(require('./package.json').dependencies['driver.js'])"
npm ci --dry-run 2>&1 | grep -c "EUSAGE"
```
Expected: `^1.10.2`, then `0` (the lockfile is in sync).

- [ ] **Step 2: Write the launcher**

Create `src/components/onboarding/TourLauncher.tsx`:

```tsx
"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle } from 'lucide-react'
import posthog from 'posthog-js'
import type { Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { getOnboardingState, markTourSeen } from '@/lib/onboarding/actions'
import { shouldAutoStart, type OnboardingState, type TourId } from '@/lib/onboarding/state'
import { resolveSteps, selectorFor } from '@/lib/onboarding/steps'
import { TOURS } from '@/lib/onboarding/tours'

const AUTO_START_DELAY_MS = 3000
const DESKTOP_QUERY = '(min-width: 1024px)'

// Spotlight tour for one section. Desktop only: below 1024 px it renders
// nothing (phones get the handoff card instead).
export function TourLauncher({ tourId }: { tourId: TourId }) {
  const t = useTranslations('Onboarding')
  const tRef = useRef(t)
  tRef.current = t
  const [isDesktop, setIsDesktop] = useState(false)
  const stateRef = useRef<OnboardingState | null>(null)
  const driverRef = useRef<Driver | null>(null)
  const runningRef = useRef(false)

  const start = useCallback(
    async (trigger: 'auto' | 'manual') => {
      if (runningRef.current) return
      const steps = resolveSteps(TOURS[tourId], (anchor) => document.querySelector(selectorFor(anchor)) !== null)
      if (steps.length === 0) return
      runningRef.current = true

      const { driver } = await import('driver.js')
      const label = tRef.current
      const alreadySeen = Boolean(stateRef.current?.tours[tourId])
      posthog.capture('tour_started', { tourId, trigger })

      const instance = driver({
        showProgress: true,
        progressText: '{{current}} / {{total}}',
        nextBtnText: label('ui.next'),
        prevBtnText: label('ui.prev'),
        doneBtnText: label('ui.done'),
        popoverClass: 'joben-tour',
        stagePadding: 6,
        overlayOpacity: 0.6,
        smoothScroll: true,
        steps: steps.map((step) => ({
          element: selectorFor(step.anchor),
          popover: {
            title: label(`tours.${tourId}.${step.key}.title`),
            description: label(`tours.${tourId}.${step.key}.body`),
          },
        })),
        onHighlightStarted: (_element, _step, opts) => {
          posthog.capture('tour_step_viewed', { tourId, stepIndex: opts.index })
        },
        onDestroyed: (_element, _step, opts) => {
          runningRef.current = false
          const reason = opts.reason
          // 'api' and 'replaced' mean the page changed under the tour: neither a skip nor a finish.
          if (reason !== 'done' && reason !== 'close' && reason !== 'escape' && reason !== 'overlay') return
          if (reason === 'done') posthog.capture('tour_completed', { tourId })
          else posthog.capture('tour_skipped', { tourId, stepIndex: opts.index })
          if (!alreadySeen) {
            void markTourSeen(tourId).catch(() => undefined)
            if (stateRef.current) {
              stateRef.current = { ...stateRef.current, tours: { ...stateRef.current.tours, [tourId]: new Date().toISOString() } }
            }
          }
        },
      })
      driverRef.current = instance
      instance.drive()
    },
    [tourId]
  )

  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY)
    setIsDesktop(query.matches)
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    getOnboardingState()
      .then((state) => {
        if (cancelled) return
        stateRef.current = state
        if (shouldAutoStart({ state, tourId, isDesktop })) {
          timer = setTimeout(() => void start('auto'), AUTO_START_DELAY_MS)
        }
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (driverRef.current?.isActive()) driverRef.current.destroy()
    }
  }, [isDesktop, tourId, start])

  if (!isDesktop) return null

  return (
    <button
      type="button"
      onClick={() => void start('manual')}
      aria-label={t('ui.help')}
      title={t('ui.help')}
      className="fixed bottom-5 right-5 z-40 grid h-10 w-10 place-items-center border border-(--border) bg-(--surface) text-(--foreground) transition-colors duration-150 ease-out hover:border-(--accent)"
    >
      <HelpCircle className="h-5 w-5" />
    </button>
  )
}
```

- [ ] **Step 3: Add the popover theme**

Append to the end of `src/app/[locale]/globals.css` (after the last existing rule, outside any media query):

```css
/* Onboarding tours (driver.js): follow the site theme in light and dark. */
.driver-popover.joben-tour {
  background: var(--surface);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 0;
  box-shadow: none;
}
.driver-popover.joben-tour .driver-popover-title {
  color: var(--foreground);
  font-weight: 700;
}
.driver-popover.joben-tour .driver-popover-description,
.driver-popover.joben-tour .driver-popover-progress-text {
  color: var(--muted);
}
.driver-popover.joben-tour .driver-popover-close-btn {
  color: var(--muted);
}
.driver-popover.joben-tour .driver-popover-navigation-btns button {
  background: var(--surface-elevated);
  color: var(--foreground);
  border: 1px solid var(--border);
  border-radius: 0;
  text-shadow: none;
}
.driver-popover.joben-tour .driver-popover-navigation-btns button:last-child {
  background: var(--accent);
  color: var(--accent-ink);
  border-color: var(--accent);
}
.driver-popover.joben-tour .driver-popover-arrow-side-left { border-left-color: var(--surface); }
.driver-popover.joben-tour .driver-popover-arrow-side-right { border-right-color: var(--surface); }
.driver-popover.joben-tour .driver-popover-arrow-side-top { border-top-color: var(--surface); }
.driver-popover.joben-tour .driver-popover-arrow-side-bottom { border-bottom-color: var(--surface); }
```

- [ ] **Step 4: Type-check, lint, build the client bundle**

```bash
npx tsc --noEmit && npm run lint
```
Expected: no errors. (`opts.index` and `opts.reason` exist on `HookOpts` in `driver.js` 1.10.2; if `tsc` disagrees, read `node_modules/driver.js/dist/driver.js.d.ts` and adjust.)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/components/onboarding/TourLauncher.tsx "src/app/[locale]/globals.css"
git commit -m "feat(onboarding): TourLauncher with driver.js and site theme

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Dashboard anchors, mount and activation checklist

**Files:**
- Modify: `src/components/dashboard/Sidebar.tsx`
- Modify: `src/components/dashboard/ProfileCompletion.tsx` (rewrite)
- Modify: `src/lib/actions/db.ts` (`DashboardStats` gets `pdfExports`)
- Modify: `src/app/[locale]/dashboard/page.tsx`
- Modify: `messages/en.json`, `messages/ro.json` (`Dashboard.profileCompletion`)

**Interfaces:**
- Consumes: `TourLauncher` (Task 4), `getOnboardingState` and `dismissChecklist` (Task 2).
- Produces: `DashboardStats.pdfExports: number`; `ProfileCompletion({ stats, dismissed })`; anchors `dashboard-sidebar`, `dashboard-create`, `dashboard-checklist`, `dashboard-ats`, `dashboard-referral`.

- [ ] **Step 1: Count PDF exports in the stats**

In `src/lib/actions/db.ts`:

1. In `type DashboardStats`, change
```ts
  aiReviews: number
  averageScore: number
}
```
to
```ts
  aiReviews: number
  pdfExports: number
  averageScore: number
}
```
2. In `getUserDashboardStats`, replace
```ts
    const [resumesRes, coverLettersRes, aiReviewsRes] = await Promise.all([
      supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('cover_letters').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ])
```
with
```ts
    const [resumesRes, coverLettersRes, aiReviewsRes, pdfExportsRes] = await Promise.all([
      supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('cover_letters').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase
        .from('product_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_clerk_id', userId)
        .eq('event_name', 'resume_exported_pdf'),
    ])
```
3. In the success return, after `aiReviews: aiReviewsRes.count || 0,` add `pdfExports: pdfExportsRes.count || 0,`.
4. In the catch fallback, change `return { resumes: 0, coverLetters: 0, aiReviews: 0, averageScore: 0 } as DashboardStats` to `return { resumes: 0, coverLetters: 0, aiReviews: 0, pdfExports: 0, averageScore: 0 } as DashboardStats`.

Run: `npx tsc --noEmit` (expected: no errors; `StatCards` takes a structural subset so it still compiles).

- [ ] **Step 2: Add the checklist copy**

In `messages/en.json`, replace `"item3": "Get AI review"` with
```json
"item3": "Get AI review",
      "item4": "Export your first PDF",
      "close": "Dismiss"
```
In `messages/ro.json`, replace `"item3": "Obține o evaluare AI"` with
```json
"item3": "Obține o evaluare AI",
      "item4": "Exportă primul tău PDF",
      "close": "Închide"
```

- [ ] **Step 3: Rewrite the checklist component**

Replace the whole content of `src/components/dashboard/ProfileCompletion.tsx` with:

```tsx
"use client"
import { X, CheckCircle2, Circle } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { dismissChecklist } from '@/lib/onboarding/actions'

type ChecklistStats = { resumes: number; coverLetters: number; aiReviews: number; pdfExports: number }

// Activation checklist: four steps up to the first exported PDF. Completion
// comes from existing stats; only "dismissed" is stored (users.onboarding).
export function ProfileCompletion({ stats, dismissed }: { stats: ChecklistStats; dismissed: boolean }) {
  const t = useTranslations('Dashboard.profileCompletion')
  const [isVisible, setIsVisible] = useState(!dismissed)
  const [, startTransition] = useTransition()

  const items = [
    { done: stats.resumes > 0, label: t('item1'), href: '/resumes/new' },
    { done: stats.aiReviews > 0, label: t('item3'), href: '/ai-review' },
    { done: stats.coverLetters > 0, label: t('item2'), href: '/cover-letters/new' },
    { done: stats.pdfExports > 0, label: t('item4'), href: '/resumes' },
  ]
  const completed = items.filter((item) => item.done).length
  if (!isVisible || completed === items.length) return null
  const percent = (completed / items.length) * 100

  const handleDismiss = () => {
    setIsVisible(false)
    startTransition(() => {
      void dismissChecklist().catch(() => undefined)
    })
  }

  return (
    <div data-tour="dashboard-checklist" className="bg-(--surface) p-6 border border-(--border) relative mb-8" suppressHydrationWarning>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label={t('close')}
        className="absolute top-4 right-4 text-(--muted) hover:text-(--foreground) transition-colors duration-150 ease-out"
      >
        <X className="w-5 h-5" />
      </button>
      <h3 className="text-xl font-bold text-(--foreground) mb-4">{t('titlePrefix')}{Math.round(percent)}%</h3>
      <div className="w-full bg-(--border) h-1 mb-6">
        <div className="bg-(--accent) h-1" style={{ width: `${percent}%` }}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="flex items-center gap-3 hover:text-(--foreground) transition-colors duration-150 ease-out">
            {item.done ? <CheckCircle2 className="w-5 h-5 text-(--foreground)" /> : <Circle className="w-5 h-5 text-(--muted)" />}
            <span className={item.done ? 'text-(--foreground)' : 'text-(--muted)'}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Anchor the sidebar**

In `src/components/dashboard/Sidebar.tsx`:
- change `<aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-(--border) bg-(--surface) min-h-screen sticky top-0">` to `<aside data-tour="dashboard-sidebar" className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-(--border) bg-(--surface) min-h-screen sticky top-0">`
- change `<div className="px-5 mb-4">` to `<div data-tour="dashboard-create" className="px-5 mb-4">`

- [ ] **Step 5: Wire the dashboard page**

In `src/app/[locale]/dashboard/page.tsx`:
1. After `import { MobileHandoffCard } from '@/components/dashboard/MobileHandoffCard'` add:
```ts
import { TourLauncher } from '@/components/onboarding/TourLauncher'
import { getOnboardingState } from '@/lib/onboarding/actions'
```
2. After `const stats = await getUserDashboardStats(userId)` add `const onboarding = await getOnboardingState()`.
3. Change `<ProfileCompletion stats={stats} />` to `<ProfileCompletion stats={stats} dismissed={onboarding.checklistDismissedAt !== null} />`.
4. Change `{atsScanCard.kind === 'card' && <AtsScanCard scan={atsScanCard.scan} locale={locale} />}` to
```tsx
{atsScanCard.kind === 'card' && (
  <div data-tour="dashboard-ats">
    <AtsScanCard scan={atsScanCard.scan} locale={locale} />
  </div>
)}
```
5. Change `<ReferralCard className="mb-8" />` to `<div data-tour="dashboard-referral"><ReferralCard className="mb-8" /></div>`.
6. Change `<RecentDocuments recentDocs={recentDocs} />\n        </main>` so the last children of `<main>` are:
```tsx
          <RecentDocuments recentDocs={recentDocs} />
          <TourLauncher tourId="dashboard" />
        </main>
```

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit && npm run lint && npm test
git add src/components/dashboard/Sidebar.tsx src/components/dashboard/ProfileCompletion.tsx src/lib/actions/db.ts "src/app/[locale]/dashboard/page.tsx" messages/en.json messages/ro.json
git commit -m "feat(onboarding): dashboard tour anchors and activation checklist

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: all green; `tests/onboarding-tours.test.ts` still passes (the new `Dashboard.profileCompletion` keys are outside `Onboarding`).

---

### Task 6: CV list and cover letter list

**Files:**
- Modify: `src/app/[locale]/resumes/page.tsx`
- Modify: `src/app/[locale]/cover-letters/page.tsx`

**Interfaces:**
- Consumes: `TourLauncher` (Task 4).
- Produces: anchors `resumes-create`, `resumes-row`, `resumes-actions`, `letters-create`, `letters-row`, `letters-actions`.

- [ ] **Step 1: Resumes page**

In `src/app/[locale]/resumes/page.tsx`:
1. Add `import { TourLauncher } from '@/components/onboarding/TourLauncher'` after `import { timeAgo } from '@/lib/time-ago'`.
2. Change `<Link href="/resumes/new" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>` to `<Link href="/resumes/new" data-tour="resumes-create" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>`.
3. Change `{visibleResumes.map((resume) => (` to `{visibleResumes.map((resume, index) => (`.
4. Change `<div key={resume.id} className="row-invert flex items-center justify-between gap-4 px-4 py-3">` to `<div key={resume.id} data-tour={index === 0 ? 'resumes-row' : undefined} className="row-invert flex items-center justify-between gap-4 px-4 py-3">`.
5. Change `<div className="flex items-center gap-3 shrink-0">` (the actions group inside the row; it is the only one with `shrink-0` after the title block) to `<div data-tour={index === 0 ? 'resumes-actions' : undefined} className="flex items-center gap-3 shrink-0">`.
6. Make `<TourLauncher tourId="resumes" />` the last child of `<main>` (insert it on the line before the closing `</main>`).

- [ ] **Step 2: Cover letters page**

In `src/app/[locale]/cover-letters/page.tsx`:
1. Add `import { TourLauncher } from '@/components/onboarding/TourLauncher'` after `import { timeAgo } from '@/lib/time-ago'`.
2. Change `<Link href="/cover-letters/new" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>` to `<Link href="/cover-letters/new" data-tour="letters-create" className={`w-full justify-center sm:w-auto ${buttonVariants('primary', 'md')}`}>`.
3. Change `{visibleLetters.map((letter) => (` to `{visibleLetters.map((letter, index) => (`.
4. Change `<div key={letter.id} className="row-invert flex items-center justify-between gap-4 px-4 py-3">` to `<div key={letter.id} data-tour={index === 0 ? 'letters-row' : undefined} className="row-invert flex items-center justify-between gap-4 px-4 py-3">`.
5. Change `<div className="flex items-center gap-3 shrink-0">` to `<div data-tour={index === 0 ? 'letters-actions' : undefined} className="flex items-center gap-3 shrink-0">`.
6. Make `<TourLauncher tourId="coverLetters" />` the last child of `<main>`.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/resumes/page.tsx" "src/app/[locale]/cover-letters/page.tsx"
git commit -m "feat(onboarding): tours for the CV and cover letter lists

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: no errors. If an `Edit` reports more than one match for the actions-group line, include the preceding `<span className="font-mono text-xs ...` line in the match.

---

### Task 7: CV editor

**Files:**
- Modify: `src/components/builder/ResumeBuilderMount.tsx`
- Modify: `src/components/builder/ResumeBuilder.tsx` (five anchors)

**Interfaces:**
- Consumes: `TourLauncher` (Task 4).
- Produces: anchors `editor-tabs`, `editor-import`, `editor-tailor`, `editor-preview`, `editor-export`. Mounted for both `/resumes/new` and `/resumes/[id]` through `ResumeBuilderMount`.

- [ ] **Step 1: Mount the launcher**

Replace the content of `src/components/builder/ResumeBuilderMount.tsx` with:

```tsx
"use client"

import dynamic from 'next/dynamic'
import { TourLauncher } from '@/components/onboarding/TourLauncher'

const ResumeBuilderNoSSR = dynamic(
  () => import('@/components/builder/ResumeBuilder').then((m) => m.ResumeBuilder),
  { ssr: false }
)

export function ResumeBuilderMount() {
  return (
    <>
      <ResumeBuilderNoSSR />
      <TourLauncher tourId="editor" />
    </>
  )
}
```

- [ ] **Step 2: Anchor the five elements in ResumeBuilder.tsx**

1. Tabs bar: change
`className="shrink-0 border-b border-(--border) px-4 pt-5 pb-4 flex items-center gap-2.5 overflow-x-auto overflow-y-hidden custom-scrollbar tabs-scrollbar scroll-smooth"`
to
`data-tour="editor-tabs"` on its own line above it, keeping the `className` line unchanged (the `<div` already has `suppressHydrationWarning` and `style` props; add the attribute as one more prop).
2. Import button: in the `<button` whose `onClick` starts with `if (getPdfImportCount(resumeData) >= MAX_PDF_IMPORTS_PER_RESUME) {`, add `data-tour="editor-import"` as the first prop after `<button`.
3. Tailor button: on `<FeatureButton\n              feature="jds"\n              onClick={() => setIsTailorModalOpen(true)}` add `data-tour="editor-tailor"` as a prop (`FeatureButton` spreads `...rest` onto its `<button>`).
4. Save and export bar: change `<div className="shrink-0 p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4" suppressHydrationWarning>` to `<div data-tour="editor-export" className="shrink-0 p-4 border-t border-(--border) bg-(--background) flex justify-between items-center gap-4" suppressHydrationWarning>`.
5. Live preview pane: change `<div className="grow min-w-0 bg-(--background) h-full flex flex-col p-4 lg:p-8 overflow-hidden relative print:p-0 print:block print:bg-white print:h-auto" suppressHydrationWarning>` to the same element with `data-tour="editor-preview"` added as the first prop.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add src/components/builder/ResumeBuilderMount.tsx src/components/builder/ResumeBuilder.tsx
git commit -m "feat(onboarding): editor tour anchors and mount

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: AI Review

**Files:**
- Modify: `src/app/[locale]/ai-review/page.tsx`

**Interfaces:**
- Consumes: `TourLauncher` (Task 4).
- Produces: anchors `ai-upload`, `ai-jd`, `ai-start`, `ai-history`.

- [ ] **Step 1: Add the anchors and the mount**

In `src/app/[locale]/ai-review/page.tsx`:
1. Add `import { TourLauncher } from '@/components/onboarding/TourLauncher'` after `import { useServerError } from '@/hooks/useServerError'`.
2. Dropzone: change `<div\n                role="button"\n                tabIndex={0}\n                className={`border border-dashed p-8 text-center transition-colors duration-150 ease-out ${` so the element gets `data-tour="ai-upload"` as a prop right after `role="button"`.
3. Job description: change `<textarea\n                value={jobDescription}` to `<textarea\n                data-tour="ai-jd"\n                value={jobDescription}`.
4. Start button: change `<button\n                  onClick={() => void handleAnalyze()}\n                  disabled={isProcessingUpload}` to `<button\n                  data-tour="ai-start"\n                  onClick={() => void handleAnalyze()}\n                  disabled={isProcessingUpload}`.
5. History: change the `<div className="border border-(--border) bg-(--surface) p-5">` whose first child is `<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">` (it contains the `reviewExistingResume` heading) to `<div data-tour="ai-history" className="border border-(--border) bg-(--surface) p-5">`.
6. Add `<TourLauncher tourId="aiReview" />` as the last child of `<main>` (line before the closing `</main>`, right before `</div>` that closes the column).

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add "src/app/[locale]/ai-review/page.tsx"
git commit -m "feat(onboarding): AI Review tour anchors and mount

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Anchor guard, full verification, migration, PR

**Files:**
- Test: `tests/onboarding-anchors.test.ts`

**Interfaces:**
- Consumes: `TOURS` (Task 3) and every anchor from Tasks 5 to 8.

- [ ] **Step 1: Write the anchor guard test**

Create `tests/onboarding-anchors.test.ts`:

```ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { TOUR_IDS } from '@/lib/onboarding/state'
import { TOURS } from '@/lib/onboarding/tours'

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sourceFiles(path)
    return /\.(tsx|ts)$/.test(name) ? [path] : []
  })
}

describe('tour anchors exist in the source', () => {
  const lines = sourceFiles(join(process.cwd(), 'src'))
    .filter((file) => !file.includes(`${join('lib', 'onboarding')}`))
    .flatMap((file) => readFileSync(file, 'utf8').split(/\r?\n/))
    .filter((line) => line.includes('data-tour='))

  for (const id of TOUR_IDS) {
    for (const step of TOURS[id]) {
      it(`${id}: ${step.anchor}`, () => {
        const found = lines.some((line) => line.includes(`"${step.anchor}"`) || line.includes(`'${step.anchor}'`))
        expect(found).toBe(true)
      })
    }
  }
})
```

- [ ] **Step 2: Run the whole suite, lint, types and build**

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```
Expected: all green, including 20 anchor tests. A failing anchor test names the missing anchor; fix the markup in the matching task's file.

- [ ] **Step 3: Manual browser check on a brand-new account (local)**

Run `npm run dev`. Use a fresh Clerk test account on `localhost:3000/ro/dashboard` at a 1280 px wide window (the user's own browser through the Claude in Chrome extension). Verify, writing down each result:
1. The dashboard tour starts about 3 s after load, in the order sidebar, create, checklist (the ATS step is skipped without a scan, referral last). Esc closes it, a reload does not restart it.
2. The "?" button (bottom right) restarts it. Popover colors follow the theme in dark and light.
3. `/ro/resumes`, `/ro/cover-letters`, `/ro/resumes/new`, `/ro/ai-review` each start their own tour once. On the editor the 3 s delay does not collide with an import modal; if it does, raise `AUTO_START_DELAY_MS` or wait for the modal in `TourLauncher.start`.
4. A second browser profile signed in as the same user does not restart the tours already seen.
5. Under 1024 px: no tour and no "?" button; the handoff card is unchanged.
6. The checklist links go to the right pages, "Dismiss" survives a reload, and it disappears at 4 of 4.
Before this step the migration must be applied to the database the dev server uses. The owner approves applying `supabase/migrations/20261025130000_add_users_onboarding.sql` (`npx supabase db push`; rename `.env.local` aside first and never use `--debug`, see the saved note about the Supabase CLI bug). Without the column, `getOnboardingState` falls back to the never-start state and nothing runs.

- [ ] **Step 4: PostHog check**

After step 3, query PostHog for `tour_started`, `tour_step_viewed`, `tour_completed` and `tour_skipped` from the last hour and confirm they carry `tourId` (and `stepIndex` where listed).

- [ ] **Step 5: Update TODO.md, commit, push, open the PR**

In `TODO.md`, change the onboarding line from `[IN PROGRESS]` to `[DONE]` only after the owner confirms the manual check; otherwise leave it and list what remains. Then:

```bash
git add tests/onboarding-anchors.test.ts TODO.md
git commit -m "test(onboarding): guard that every tour anchor exists in the source

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin feat/onboarding-tours
gh pr create --base main --title "Onboarding: tururi per secțiune și checklist de activare" --body-file "$TEMP/pr-onboarding.md"
```
The PR body (Romanian, like the earlier PRs) lists the five tours, the checklist change, the `users.onboarding` migration (existing users marked `legacy`), the `driver.js` dependency, what was verified, and the manual steps still open. End it with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
