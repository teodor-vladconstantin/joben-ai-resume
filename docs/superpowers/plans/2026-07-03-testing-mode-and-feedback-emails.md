# Testing-Mode Payments, Contact Email Swap, and Feedback Emails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Swap the public contact address to `duku@joben.eu`, replace every Stripe checkout entry point with a "we're still testing, no payment, please give feedback" notice (with a server-side refusal as a safety net), and add a Resend automation that asks users for feedback 10 minutes after creating a resume or 1 hour after downloading a resume/cover-letter PDF, capped at one feedback email per user per rolling 24 hours.

**Architecture:** Three independent slices sharing no code: (1) three literal string edits, (2) a client component rewrite (`UpgradeModal`) consumed by five call sites plus one new backend guard, (3) one new Resend send function, one new tracked product event, and one new cron endpoint following the exact claim-then-send pattern already used by `src/app/api/cron/inactivity-3d/route.ts` and `src/app/api/cron/followup-7d/route.ts`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Supabase (`product_events`, `email_events` tables — no schema changes needed), Resend, Vitest with `vi.mock`.

## Global Constraints

- All new user-facing copy (modal text, feedback emails) is Romanian, personal tone ("from Duku"), per `docs/superpowers/specs/2026-07-03-testing-mode-and-feedback-emails-design.md`. Do not translate existing English site copy.
- Feedback form URL, use verbatim: `https://app.youform.com/forms/vorotlgc`
- New contact address, use verbatim: `duku@joben.eu`
- Feedback email subject, use verbatim: `Cum a fost experiența cu Joben?`
- Feedback email "from", use verbatim: `Duku from Joben <duku@joben.eu>`
- No Supabase migration in this plan — `email_events.email_type` is free text and the existing unique index on `(user_clerk_id, email_type, source_event_id)` already supports new email types.
- Redeem-code flow (`src/app/api/billing/redeem-code/route.ts`, `RedeemCodeCard`) is out of scope — do not touch it.
- Run `npx tsc --noEmit` and `npm run lint` after every task; run `npm run test` (vitest) after every task that touches tested code.

---

### Task 1: Contact email swap

**Files:**
- Modify: `src/app/privacy/page.tsx:79`
- Modify: `src/app/terms/page.tsx:74`
- Modify: `src/app/pricing/page.tsx:144`

**Interfaces:** None — plain string literal edits, no new exports or signatures.

- [ ] **Step 1: Replace the address in all three files**

In `src/app/privacy/page.tsx`, line 79, change:
```ts
      'For privacy requests or questions, contact us at admin@joben.eu.',
```
to:
```ts
      'For privacy requests or questions, contact us at duku@joben.eu.',
```

In `src/app/terms/page.tsx`, line 74, change:
```ts
      'For legal or privacy-related questions, contact us at admin@joben.eu.',
```
to:
```ts
      'For legal or privacy-related questions, contact us at duku@joben.eu.',
```

In `src/app/pricing/page.tsx`, line 144, change:
```tsx
            Questions? Contact us at <a href="mailto:admin@joben.eu" className="text-accent hover:underline">admin@joben.eu</a>
```
to:
```tsx
            Questions? Contact us at <a href="mailto:duku@joben.eu" className="text-accent hover:underline">duku@joben.eu</a>
```

- [ ] **Step 2: Verify no other live references remain**

Run: `grep -rn "admin@joben.eu" src/`
Expected: no output (only remaining match is the historical `TODO.md` entry, which is outside `src/` and intentionally untouched).

- [ ] **Step 3: Typecheck and commit**

Run: `npx tsc --noEmit`
Expected: no errors.

```bash
git add src/app/privacy/page.tsx src/app/terms/page.tsx src/app/pricing/page.tsx
git commit -m "fix: replace admin@joben.eu with duku@joben.eu in public contact copy"
```

---

### Task 2: Repurpose UpgradeModal into a testing-mode notice

**Files:**
- Modify: `src/components/ui/UpgradeModal.tsx`

**Interfaces:**
- Produces: `UpgradeModal({ open, onClose }: UpgradeModalProps)` — a React component. `UpgradeModalProps` keeps `title?: string`, `description?: string`, `onUpgrade?: () => Promise<void>` as **optional, unused** fields so the five existing call sites (Task 3) don't need to stop passing them — this keeps that task's diff to one line per file instead of touching unrelated `upgradeMessage` state plumbing.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/ui/UpgradeModal.tsx` with:

```tsx
"use client"

import { MessageCircle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { buttonVariants } from '@/components/ui/Button'

const FEEDBACK_FORM_URL = 'https://app.youform.com/forms/vorotlgc'

type UpgradeModalProps = {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  onUpgrade?: () => Promise<void>
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Suntem încă în testare"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-(--border) bg-(--surface) px-4 py-2 text-sm text-(--muted)"
          >
            Am înțeles
          </button>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants('primary', 'md')}
          >
            Lasă-mi feedback
          </a>
        </div>
      }
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-(--accent-strong)/35 bg-(--accent-muted) text-(--accent-strong)">
        <MessageCircle className="h-5 w-5" />
      </div>

      <p className="text-sm text-(--foreground)/72">
        Salut! Joben e încă în perioada de testare, așa că nu încasăm plăți acum — poți continua să folosești
        aplicația liber.
      </p>
      <p className="mt-3 text-sm text-(--foreground)/72">
        Mi-ar fi de mare ajutor să aflu ce părere ai: ce funcționează bine, ce lipsește, ce ai schimba.
      </p>
    </Modal>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (the five call sites in Task 3 still pass `title`/`description`/`onUpgrade`, which remain valid optional props at this point — they'll be cleaned up in Task 3, but the build is not broken in between).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/UpgradeModal.tsx
git commit -m "feat: repurpose UpgradeModal into a testing-mode feedback notice"
```

---

### Task 3: Point UpgradeToProButton at the notice modal instead of checkout

**Files:**
- Modify: `src/components/pricing/UpgradeToProButton.tsx`

**Interfaces:**
- Consumes: `UpgradeModal` from Task 2 (`{ open, onClose }`).
- Produces: `UpgradeToProButton({ signedIn }: { signedIn: boolean })` unchanged signature.

- [ ] **Step 1: Rewrite the component**

Replace the full contents of `src/components/pricing/UpgradeToProButton.tsx` with:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { UpgradeModal } from '@/components/ui/UpgradeModal'

export function UpgradeToProButton({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false)

  if (!signedIn) {
    return (
      <Link href="/sign-up" className="block w-full text-center">
        <Button variant="primary" className="w-full">
          Upgrade to Pro
        </Button>
      </Link>
    )
  }

  return (
    <>
      <Button variant="primary" className="w-full" onClick={() => setOpen(true)}>
        Upgrade to Pro
      </Button>
      <UpgradeModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pricing/UpgradeToProButton.tsx
git commit -m "feat: open testing-mode notice from pricing page instead of Stripe checkout"
```

---

### Task 4: Drop the checkout wiring from the four UpgradeModal call sites

**Files:**
- Modify: `src/components/builder/ResumeBuilder.tsx:2168-2174`
- Modify: `src/components/cover-letter/CoverLetterBuilder.tsx:609-615`
- Modify: `src/app/ai-review/page.tsx:443-449`
- Modify: `src/app/ai-review/[id]/page.tsx:286-292`

**Interfaces:**
- Consumes: `UpgradeModal` from Task 2 — `onUpgrade` is now optional and ignored, so it's safe to stop passing it.

- [ ] **Step 1: `src/components/builder/ResumeBuilder.tsx`**

Remove the `startProCheckout` import (find the line importing it from `@/lib/client-billing` and delete it), and change:
```tsx
      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
```
to:
```tsx
      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
      />
```
(`upgradeMessage`/`setUpgradeMessage` state stays untouched — it's still assigned a value from API error payloads elsewhere in the file; only the checkout callback is removed.)

- [ ] **Step 2: `src/components/cover-letter/CoverLetterBuilder.tsx`**

Same edit: remove the `import { startProCheckout } from '@/lib/client-billing'` line, and remove the `onUpgrade={startProCheckout}` line from:
```tsx
      <UpgradeModal
        open={showUpgradeModal}
        title="Upgrade to Continue AI Generation"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
```

- [ ] **Step 3: `src/app/ai-review/page.tsx`**

Same edit: remove the `import { startProCheckout } from '@/lib/client-billing'` line, and remove the `onUpgrade={startProCheckout}` line from:
```tsx
      <UpgradeModal
        open={showUpgradeModal}
        title="Upgrade to Pro Analyzer"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
```

- [ ] **Step 4: `src/app/ai-review/[id]/page.tsx`**

Same edit: remove the `import { startProCheckout } from '@/lib/client-billing'` line, and remove the `onUpgrade={startProCheckout}` line from:
```tsx
      <UpgradeModal
        open={showUpgradeModal}
        title="Pro Feature"
        description={upgradeMessage}
        onClose={() => setShowUpgradeModal(false)}
        onUpgrade={startProCheckout}
      />
```

- [ ] **Step 5: Verify no remaining `startProCheckout` imports outside client-billing.ts itself**

Run: `grep -rn "startProCheckout" src/`
Expected: only `src/lib/client-billing.ts` (its own definition) — no importers left. This confirms Task 5 can safely delete the file.

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/builder/ResumeBuilder.tsx src/components/cover-letter/CoverLetterBuilder.tsx src/app/ai-review/page.tsx "src/app/ai-review/[id]/page.tsx"
git commit -m "fix: stop wiring UpgradeModal to Stripe checkout at all call sites"
```

---

### Task 5: Delete the now-dead client-billing checkout helper

**Files:**
- Delete: `src/lib/client-billing.ts`

**Interfaces:** None — Task 4's Step 5 already confirmed zero remaining importers.

- [ ] **Step 1: Delete the file**

```bash
rm src/lib/client-billing.ts
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors (no remaining imports of this module).

- [ ] **Step 3: Commit**

```bash
git add -A src/lib/client-billing.ts
git commit -m "chore: delete client-billing.ts, no longer used after checkout disable"
```

---

### Task 6: Backend refusal on /api/billing/checkout

**Files:**
- Modify: `src/app/api/billing/checkout/route.ts` (full rewrite)
- Create: `tests/api/billing-checkout.test.ts`

**Interfaces:**
- Produces: `POST(req: Request): Promise<Response>` — always responds `403` with `{ error: string }` containing the word "testing". No Stripe/Supabase calls are made.

- [ ] **Step 1: Write the failing test**

Create `tests/api/billing-checkout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

describe('billing checkout API', () => {
  it('refuses to start checkout while payments are disabled', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', { method: 'POST' })
    )
    const payload = (await response.json()) as { error?: string }

    expect(response.status).toBe(403)
    expect(payload.error).toMatch(/testing/i)
  })

  it('refuses even without authentication', async () => {
    const { POST } = await import('@/app/api/billing/checkout/route')

    const response = await POST(
      new Request('http://localhost/api/billing/checkout', { method: 'POST' })
    )

    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/billing-checkout.test.ts`
Expected: FAIL — current route requires auth/Stripe config and returns 401/503, not 403 with "testing" in the message.

- [ ] **Step 3: Rewrite the route**

Replace the full contents of `src/app/api/billing/checkout/route.ts` with:

```ts
import { getRequestId, jsonWithRequestId } from '@/lib/logger'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  return jsonWithRequestId(
    { error: 'Payments are disabled while Joben is in testing. No charge will be made.' },
    403,
    requestId
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/billing-checkout.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors (confirms no other file depended on the removed Stripe/Supabase imports from this route).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/billing/checkout/route.ts tests/api/billing-checkout.test.ts
git commit -m "fix: refuse checkout server-side while payments are disabled"
```

---

### Task 7: Track cover-letter PDF exports as a product event

**Files:**
- Modify: `src/lib/analytics.ts:4-11`
- Modify: `src/app/api/cover-letter/pdf/route.ts`

**Interfaces:**
- Produces: `ProductEventName` now includes `'cover_letter_exported_pdf'`. `trackProductEvent({ userId, eventName: 'cover_letter_exported_pdf', requestId, metadata })` is called once per successful cover-letter PDF export — this is what Task 9's cron reads from `product_events`.

- [ ] **Step 1: Add the event name to the union**

In `src/lib/analytics.ts`, change:
```ts
export type ProductEventName =
  | 'resume_created'
  | 'cover_letter_created'
  | 'resume_analyzed'
  | 'bullet_improved'
  | 'resume_exported_pdf'
  | 'checkout_started'
```
to:
```ts
export type ProductEventName =
  | 'resume_created'
  | 'cover_letter_created'
  | 'resume_analyzed'
  | 'bullet_improved'
  | 'resume_exported_pdf'
  | 'cover_letter_exported_pdf'
  | 'checkout_started'
```

- [ ] **Step 2: Track the event in the cover-letter PDF route**

In `src/app/api/cover-letter/pdf/route.ts`, add the import at the top (alongside the existing imports):
```ts
import { trackProductEvent } from '@/lib/analytics'
```

Then, right after `const arrayBuffer = await blob.arrayBuffer()` and before the `return new NextResponse(arrayBuffer, {` block, insert:
```ts
    await trackProductEvent({
      userId,
      eventName: 'cover_letter_exported_pdf',
      requestId,
      metadata: {
        bodyParagraphs: bodyParagraphs.length,
      },
    })

```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/analytics.ts src/app/api/cover-letter/pdf/route.ts
git commit -m "feat: track cover_letter_exported_pdf product event"
```

---

### Task 8: Add the feedback-request email sender

**Files:**
- Modify: `src/lib/resend.ts`

**Interfaces:**
- Produces: `sendFeedbackRequestEmail(input: { to: string; firstName?: string | null; trigger: 'resume_created' | 'document_downloaded' }): Promise<EmailResult>` — this is what Task 9's cron calls per eligible candidate.

- [ ] **Step 1: Add a dedicated from-address constant**

Near the top of `src/lib/resend.ts`, right after the existing `automationFromEmail` line, add:
```ts
const feedbackFromEmail = 'Duku from Joben <duku@joben.eu>'
```

- [ ] **Step 2: Add the send function**

Append to the end of `src/lib/resend.ts` (after `sendRateLimitEmail`):

```ts
export async function sendFeedbackRequestEmail(input: {
  to: string
  firstName?: string | null
  trigger: 'resume_created' | 'document_downloaded'
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  const firstName = input.firstName?.trim() || 'acolo'

  const introLine =
    input.trigger === 'resume_created'
      ? 'Văd că tocmai ai creat un CV pe Joben.'
      : 'Văd că tocmai ai descărcat un CV sau o scrisoare de intenție de pe Joben.'

  try {
    const response = (await client.emails.send({
      from: feedbackFromEmail,
      to: input.to,
      subject: 'Cum a fost experiența cu Joben?',
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Salut, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">${introLine}</p>
  <p style="margin:0 0 18px 0;">Sunt Duku, fac Joben. Mi-ar plăcea să aflu părerea ta directă — răspunde la acest email cu orice gând ai, bun sau rău.</p>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">Preferi un formular scurt? <a href="https://app.youform.com/forms/vorotlgc" style="color:#0A9548;">Lasă feedback aici</a>.</p>
</div>`,
    })) as ResendResponse

    if (response.error) {
      return { success: false, error: response.error.message || 'Resend send failed.' }
    }

    return { success: true, providerId: response.data?.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/resend.ts
git commit -m "feat: add sendFeedbackRequestEmail"
```

---

### Task 9: Feedback-request cron endpoint

**Files:**
- Create: `src/app/api/cron/feedback-request/route.ts`
- Create: `tests/api/cron-feedback-request.test.ts`

**Interfaces:**
- Consumes: `sendFeedbackRequestEmail` from Task 8; `product_events` rows with `event_name` in `('resume_created', 'resume_exported_pdf', 'cover_letter_exported_pdf')` (the latter two produced starting Task 7).
- Produces: `POST(request: Request): Promise<Response>` at `/api/cron/feedback-request`, auth via `CRON_SECRET` (same `Authorization: Bearer` / `x-cron-secret` header pattern as the two existing crons), `?dryRun=1` and `?limit=N` query params.

- [ ] **Step 1: Write the failing tests**

Create `tests/api/cron-feedback-request.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const createServerClientMock = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

function makeQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  builder.select = chain
  builder.eq = chain
  builder.in = chain
  builder.gte = chain
  builder.lte = chain
  builder.limit = chain
  builder.maybeSingle = () => Promise.resolve(result)
  builder.then = (resolve: (value: typeof result) => unknown) => resolve(result)
  return builder
}

describe('feedback-request cron', () => {
  beforeEach(() => {
    vi.resetModules()
    createServerClientMock.mockReset()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('returns 401 when the cron secret is missing or wrong', async () => {
    const { POST } = await import('@/app/api/cron/feedback-request/route')

    const response = await POST(
      new Request('http://localhost/api/cron/feedback-request', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      })
    )

    expect(response.status).toBe(401)
  })

  it('dry run reports scanned candidates from both event windows without sending', async () => {
    const createdEvent = {
      id: 'evt-created-1',
      user_clerk_id: 'user_1',
      event_name: 'resume_created',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    }
    const downloadedEvent = {
      id: 'evt-download-1',
      user_clerk_id: 'user_2',
      event_name: 'resume_exported_pdf',
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    }

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(makeQueryBuilder({ data: [createdEvent], error: null }))
      .mockReturnValueOnce(makeQueryBuilder({ data: [downloadedEvent], error: null }))

    createServerClientMock.mockReturnValue({ from: fromMock })

    const { POST } = await import('@/app/api/cron/feedback-request/route')

    const response = await POST(
      new Request('http://localhost/api/cron/feedback-request?dryRun=1', {
        method: 'POST',
        headers: { authorization: 'Bearer test-cron-secret' },
      })
    )
    const payload = (await response.json()) as { dryRun?: boolean; scanned?: number }

    expect(response.status).toBe(200)
    expect(payload.dryRun).toBe(true)
    expect(payload.scanned).toBe(2)
    expect(fromMock).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/api/cron-feedback-request.test.ts`
Expected: FAIL — `@/app/api/cron/feedback-request/route` doesn't exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/cron/feedback-request/route.ts`:

```ts
import { createServerClient } from '@/lib/supabase/server'
import { sendFeedbackRequestEmail } from '@/lib/resend'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

export const runtime = 'nodejs'

type ProductEventRow = {
  id: string
  user_clerk_id: string
  event_name: string
  created_at: string
}

type CronOptions = {
  dryRun: boolean
  limit: number
}

const FEEDBACK_EVENT_SOURCE = 'cron.feedback-request'

const FEEDBACK_EMAIL_TYPES = {
  resume_created: 'feedback_resume_created',
  document_downloaded: 'feedback_document_downloaded',
} as const

type FeedbackTrigger = keyof typeof FEEDBACK_EMAIL_TYPES

const CREATED_DELAY_MS = 10 * 60 * 1000
const DOWNLOAD_DELAY_MS = 60 * 60 * 1000
const LOOKBACK_MS = 24 * 60 * 60 * 1000
const DAILY_CAP_WINDOW_MS = 24 * 60 * 60 * 1000

function parseOptions(request: Request): CronOptions {
  const url = new URL(request.url)
  const dryRunParam = url.searchParams.get('dryRun')
  const limitParam = Number(url.searchParams.get('limit') || '200')

  return {
    dryRun: dryRunParam === '1' || dryRunParam === 'true',
    limit: Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 500) : 200,
  }
}

function isDuplicateError(error: { code?: string } | null): boolean {
  return error?.code === '23505'
}

function buildSourceEventId(productEventId: string): string {
  return `${FEEDBACK_EVENT_SOURCE}:${productEventId}`
}

function triggerForEventName(eventName: string): FeedbackTrigger {
  return eventName === 'resume_created' ? 'resume_created' : 'document_downloaded'
}

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false

  const authHeader = request.headers.get('authorization') || ''
  const tokenFromBearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
  const tokenFromHeader = request.headers.get('x-cron-secret') || ''

  return tokenFromBearer === cronSecret || tokenFromHeader === cronSecret
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    if (!isAuthorized(request)) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const options = parseOptions(request)
    const supabase = createServerClient()
    const now = Date.now()

    const createdWindowEnd = new Date(now - CREATED_DELAY_MS).toISOString()
    const createdWindowStart = new Date(now - CREATED_DELAY_MS - LOOKBACK_MS).toISOString()
    const downloadWindowEnd = new Date(now - DOWNLOAD_DELAY_MS).toISOString()
    const downloadWindowStart = new Date(now - DOWNLOAD_DELAY_MS - LOOKBACK_MS).toISOString()

    const { data: createdEvents, error: createdError } = await supabase
      .from('product_events')
      .select('id, user_clerk_id, event_name, created_at')
      .eq('event_name', 'resume_created')
      .gte('created_at', createdWindowStart)
      .lte('created_at', createdWindowEnd)
      .limit(options.limit)

    if (createdError) {
      logger.error('Failed to load resume_created candidates', {
        requestId,
        route: '/api/cron/feedback-request',
        error: createdError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const { data: downloadEvents, error: downloadError } = await supabase
      .from('product_events')
      .select('id, user_clerk_id, event_name, created_at')
      .in('event_name', ['resume_exported_pdf', 'cover_letter_exported_pdf'])
      .gte('created_at', downloadWindowStart)
      .lte('created_at', downloadWindowEnd)
      .limit(options.limit)

    if (downloadError) {
      logger.error('Failed to load document download candidates', {
        requestId,
        route: '/api/cron/feedback-request',
        error: downloadError.message,
      })
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    const candidates = [...((createdEvents || []) as ProductEventRow[]), ...((downloadEvents || []) as ProductEventRow[])].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    if (options.dryRun) {
      return jsonWithRequestId(
        {
          dryRun: true,
          scanned: candidates.length,
          candidates: candidates.map((event) => ({
            id: event.id,
            user_clerk_id: event.user_clerk_id,
            event_name: event.event_name,
          })),
        },
        200,
        requestId
      )
    }

    let sent = 0
    let deduped = 0
    let capped = 0
    let skipped = 0
    const failures: Array<{ id: string; reason: string }> = []

    for (const event of candidates) {
      const trigger = triggerForEventName(event.event_name)
      const emailType = FEEDBACK_EMAIL_TYPES[trigger]
      const sourceEventId = buildSourceEventId(event.id)

      const { error: lockError } = await supabase.from('email_events').insert({
        user_clerk_id: event.user_clerk_id,
        email: null,
        email_type: emailType,
        status: 'processing',
        source_event_id: sourceEventId,
        metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, stage: 'claimed' },
      })

      if (lockError) {
        if (isDuplicateError(lockError)) {
          deduped += 1
          continue
        }

        failures.push({ id: event.id, reason: lockError.message })
        logger.error('Failed to claim feedback email event lock', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: lockError.message,
        })
        continue
      }

      const dailyCapCutoff = new Date(now - DAILY_CAP_WINDOW_MS).toISOString()
      const { data: recentFeedbackEmails, error: capError } = await supabase
        .from('email_events')
        .select('id')
        .eq('user_clerk_id', event.user_clerk_id)
        .in('email_type', Object.values(FEEDBACK_EMAIL_TYPES))
        .eq('status', 'sent')
        .gte('created_at', dailyCapCutoff)
        .limit(1)

      if (capError) {
        failures.push({ id: event.id, reason: capError.message })
        logger.error('Failed to check feedback email daily cap', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: capError.message,
        })

        await supabase
          .from('email_events')
          .update({ status: 'failed', error: capError.message })
          .eq('source_event_id', sourceEventId)

        continue
      }

      if (recentFeedbackEmails && recentFeedbackEmails.length > 0) {
        capped += 1
        await supabase
          .from('email_events')
          .update({
            status: 'skipped',
            error: 'Daily feedback email cap reached',
            metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, reason: 'daily-cap' },
          })
          .eq('source_event_id', sourceEventId)
        continue
      }

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email, first_name')
        .eq('clerk_id', event.user_clerk_id)
        .maybeSingle()

      if (userError || !user?.email) {
        skipped += 1
        const reason = userError?.message || 'Missing email'
        failures.push({ id: event.id, reason })
        await supabase
          .from('email_events')
          .update({
            status: 'skipped',
            error: reason,
            metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id, reason: 'missing-email' },
          })
          .eq('source_event_id', sourceEventId)
        continue
      }

      const result = await sendFeedbackRequestEmail({
        to: user.email,
        firstName: user.first_name,
        trigger,
      })

      if (!result.success) {
        const reason = result.error || 'Send failed'
        failures.push({ id: event.id, reason })
        logger.error('Feedback email send failed', {
          requestId,
          route: '/api/cron/feedback-request',
          productEventId: event.id,
          error: reason,
        })

        await supabase
          .from('email_events')
          .update({ status: 'failed', error: reason, email: user.email })
          .eq('source_event_id', sourceEventId)

        continue
      }

      await supabase
        .from('email_events')
        .update({
          status: 'sent',
          email: user.email,
          provider_id: result.providerId || null,
          error: null,
          metadata: { source: FEEDBACK_EVENT_SOURCE, productEventId: event.id },
        })
        .eq('source_event_id', sourceEventId)

      sent += 1
    }

    logger.info('Feedback request cron execution finished', {
      requestId,
      route: '/api/cron/feedback-request',
      scanned: candidates.length,
      sent,
      deduped,
      capped,
      skipped,
      failed: failures.length,
    })

    return jsonWithRequestId(
      {
        scanned: candidates.length,
        sent,
        deduped,
        capped,
        skipped,
        failed: failures.length,
        dryRun: false,
        failures,
      },
      200,
      requestId
    )
  } catch (error) {
    logger.error('Feedback request cron top-level failure', {
      requestId,
      route: '/api/cron/feedback-request',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/api/cron-feedback-request.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/cron/feedback-request/route.ts tests/api/cron-feedback-request.test.ts
git commit -m "feat: add feedback-request cron endpoint"
```

---

### Task 10: Wire up scheduling for the new cron

**Files:**
- Create: `ops/feedback-cron.sh`
- Modify: `vercel.json`

**Interfaces:** None — operational scripts, no application code depends on these.

- [ ] **Step 1: Create the poller script**

Create `ops/feedback-cron.sh`, mirroring `ops/followup-cron.sh`:

```sh
#!/bin/sh
set -eu

INTERVAL="${FEEDBACK_CRON_INTERVAL_SECONDS:-300}"
TARGET="${FEEDBACK_CRON_TARGET_URL:-http://app:3000/api/cron/feedback-request?limit=200}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET is not set; cannot run feedback scheduler"
  exit 1
fi

echo "Feedback scheduler started (interval=${INTERVAL}s, target=${TARGET})"

while true; do
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[$NOW] Triggering feedback-request cron"

  if ! curl -fsS -X POST "$TARGET" -H "Authorization: Bearer $CRON_SECRET"; then
    echo "[$NOW] feedback-request cron trigger failed"
  fi

  sleep "$INTERVAL"
done
```

- [ ] **Step 2: Make it executable**

Run: `chmod +x ops/feedback-cron.sh`

- [ ] **Step 3: Add a matching vercel.json entry**

In `vercel.json`, add a third entry to the `crons` array (after `inactivity-3d`):

```json
{
  "crons": [
    {
      "path": "/api/cron/followup-7d",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/inactivity-3d",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/feedback-request",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

- [ ] **Step 4: Commit**

```bash
git add ops/feedback-cron.sh vercel.json
git commit -m "chore: schedule the feedback-request cron every 5 minutes on the VPS"
```

---

### Task 11: Full verification pass

**Files:** None — verification only.

- [ ] **Step 1: Full typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 2: Full lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Full test suite**

Run: `npm run test`
Expected: all tests pass, including the two new files from Task 6 and Task 9.

- [ ] **Step 4: Manual smoke check of the email swap**

Run: `grep -rn "admin@joben.eu" src/`
Expected: no output.

- [ ] **Step 5: Manual smoke check of dead checkout code**

Run: `grep -rn "startProCheckout\|client-billing" src/`
Expected: no output.
