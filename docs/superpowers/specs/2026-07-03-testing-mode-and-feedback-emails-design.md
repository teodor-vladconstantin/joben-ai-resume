# Testing-mode payments, contact email swap, and feedback email automation

Date: 2026-07-03
Status: proposed

## Context

Joben is still in a testing phase. Three changes are needed:

1. Replace the public contact address `admin@joben.eu` with `duku@joben.eu` everywhere it's user-facing.
2. Disable real payments: every "Upgrade to Pro" entry point should explain we're still testing, that no payment is being charged, and ask for feedback instead — in a personal tone, not a generic system notice.
3. Add a Resend automation that asks users for feedback shortly after two actions (resume created, resume/cover-letter downloaded), capped at one feedback email per user per day.

All copy introduced by this spec is written in Romanian, matching the tone the request was given in. (Note: the rest of the site's existing copy is English — this is an intentional exception for these new touchpoints, not a full i18n effort.)

## Part 1 — Contact email swap

Replace `admin@joben.eu` → `duku@joben.eu` in the three files that reference it as a live contact address:

- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx`
- `src/app/pricing/page.tsx`

Nothing else in the codebase references that address as a contact point — other `joben.eu` matches are domain references (`parser.joben.eu`, `clerk.joben.eu`, the apex domain) and stay untouched. The historical entry in `TODO.md` documenting the original change stays as-is (it's a log, not live content).

## Part 2 — Payment/upgrade testing message

### Current state

Every upgrade entry point funnels through `startProCheckout()` (`src/lib/client-billing.ts`), which POSTs to `/api/billing/checkout` and redirects to Stripe:

- `UpgradeToProButton` (pricing page) calls it directly on click.
- `UpgradeModal` (shown from `ResumeBuilder`, `CoverLetterBuilder`, `ai-review/page.tsx`, `ai-review/[id]/page.tsx` when a free-plan limit is hit) calls it via its `onUpgrade` prop.

The redeem-code flow (`RedeemCodeCard` → `/api/billing/redeem-code`) is a separate, non-Stripe mechanism for granting testers Pro access via a code and is out of scope — it keeps working as-is.

### Change

**`UpgradeModal.tsx`** is repurposed into a "still testing" notice, used everywhere it's currently shown:

- Drops the `onUpgrade` prop and the Stripe redirect entirely.
- Body copy (personal tone, from Duku):
  - Title: "Suntem încă în testare"
  - Body: "Salut! Joben e încă în perioada de testare, așa că nu încasăm plăți acum — poți continua să folosești aplicația liber. Mi-ar fi de mare ajutor să aflu ce părere ai: ce funcționează bine, ce lipsește, ce ai schimba."
- Footer:
  - Primary button "Lasă-mi feedback" — opens `https://app.youform.com/forms/vorotlgc` in a new tab.
  - Secondary button "Am înțeles" — closes the modal.

All four call sites (`ResumeBuilder.tsx`, `CoverLetterBuilder.tsx`, `ai-review/page.tsx`, `ai-review/[id]/page.tsx`) drop their `onUpgrade={startProCheckout}` prop and the now-unused `startProCheckout` import; they keep `open`/`onClose` unchanged.

**`UpgradeToProButton.tsx`** (pricing page) gets local `open` state and renders the same `UpgradeModal` on click, instead of calling `startProCheckout()` directly.

**`client-billing.ts`** — `startProCheckout` is deleted (dead code, no remaining callers). If the file has no other exports after that, delete the file too.

**`/api/billing/checkout/route.ts`** (backend safety net) — add an early, hard-coded refusal at the top of the `POST` handler, before any Stripe/Supabase work, returning a 403 with a short message (e.g. `{ error: 'Payments are disabled during testing.' }`). This means even a direct API call can't start a checkout session, regardless of client-side changes.

## Part 3 — Feedback email automation

### Triggers and delays

| Trigger | Product event(s) | Delay | Email type |
|---|---|---|---|
| Resume created | `resume_created` | 10 minutes | `feedback_resume_created` |
| Resume or cover letter downloaded | `resume_exported_pdf`, `cover_letter_exported_pdf` | 1 hour | `feedback_document_downloaded` |

`cover_letter_exported_pdf` doesn't exist yet — `src/app/api/cover-letter/pdf/route.ts` currently doesn't call `trackProductEvent` at all. This spec adds that call (mirroring the existing `resume_exported_pdf` tracking in `export-latex/route.ts`) and adds the event name to the `ProductEventName` union in `src/lib/analytics.ts`.

### Dedup rules

1. **Per-event, exactly-once:** each candidate `product_events` row is claimed via an `email_events` insert with `source_event_id = feedback:<product_event.id>` and the existing unique index on `(user_clerk_id, email_type, source_event_id)`. A duplicate-key error means another poll already claimed it — skip silently. This is the same claim-then-send pattern already used by `sendRateLimitEmailIfEligible` and the inactivity/followup crons.
2. **One feedback email per user per rolling 24h:** before sending, query `email_events` for `status = 'sent'`, `email_type IN ('feedback_resume_created', 'feedback_document_downloaded')`, `user_clerk_id = <user>`, `created_at >= now - 24h`. If any row is found, the claim row is updated to `status: 'skipped'` (so it's never retried) instead of sending.

### Email content

New `sendFeedbackRequestEmail()` in `src/lib/resend.ts`:

- From: `Duku from Joben <duku@joben.eu>` (a real reply-to address, not `no-reply@`, since the email explicitly asks the user to reply).
- Subject: "Cum a fost experiența cu Joben?"
- Body: personal tone, one line referencing the specific trigger (e.g. "Văd că tocmai ai creat un CV pe Joben" vs. "Văd că tocmai ai descărcat un CV/o scrisoare de intenție de pe Joben"), asks the user to hit reply directly with thoughts, and a footer with a secondary link to `https://app.youform.com/forms/vorotlgc`.

### Cron endpoint

New `src/app/api/cron/feedback-request/route.ts`, `POST`, following the existing cron pattern (`isAuthorized` via `CRON_SECRET` bearer/header, `dryRun`/`limit` query params):

1. Load candidate `product_events` for both trigger groups where the delay has elapsed, bounded by a lookback window (24h) to keep the query cheap:
   - created: `event_name = 'resume_created'`, `created_at <= now-10min`, `created_at >= now-10min-24h`
   - downloaded: `event_name IN ('resume_exported_pdf','cover_letter_exported_pdf')`, `created_at <= now-1h`, `created_at >= now-1h-24h`
2. Merge both sets, sorted by `created_at` ascending, so the daily cap is applied in the order actions actually happened.
3. For each candidate: claim (insert `email_events` row, `status: 'processing'`) → on duplicate-key, skip; on other insert error, log and skip. Then apply the daily-cap check (see above). Then look up the user's email/first name, send, and update the claim row to `sent`/`failed`.

### Scheduling

Mirrors the existing `ops/followup-cron.sh` pattern (a shell loop that curls the endpoint on an interval, run on the VPS — the `vercel.json` cron entries in this repo are vestigial and not what actually drives production). Add `ops/feedback-cron.sh`, identical structure, targeting `/api/cron/feedback-request` with a default interval of 300 seconds (5 minutes) via a `FEEDBACK_CRON_*` env var pair, and add a matching (best-effort) entry to `vercel.json` for consistency with the existing two crons.

### No schema changes

`email_events` and `product_events` already have everything needed (`email_type` is free text, `source_event_id` uniqueness already covers arbitrary source keys). No new migration required.

## Out of scope

- Any change to the redeem-code flow.
- Any change to existing lifecycle emails (welcome, 7-day followup, 3-day inactivity, rate-limit, first-resume).
- Full site i18n — only the specific new copy in this spec is Romanian.
