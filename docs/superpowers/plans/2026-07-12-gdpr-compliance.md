# GDPR Compliance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make joben.eu (Next.js 14 App Router + Supabase + Clerk) GDPR compliant: complete legal pages, a real cookie consent gate, working delete-account/export-data flows, RLS on every user-data table, and PII scrubbing in logs/Sentry.

**Architecture:** No new services. Everything is additive within the existing stack — Supabase (service-role Postgres client), Clerk (`clerkClient` server SDK for account deletion), Stripe (subscription cancellation), PostHog (`opt_out_capturing_by_default` consent gate), Sentry (`beforeSend` scrubbing). Legal pages reuse the existing `sections.map()` pattern already in `/privacy` and `/terms`.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind (CSS custom properties: `--background`, `--accent`, `--foreground`, `--muted`, `--border`), Supabase Postgres (RLS), Clerk, Stripe, Resend, Upstash Redis, PostHog, Sentry, Vitest.

## Global Constraints

- TypeScript strict — no `any`.
- App Router only; prefer existing helper patterns (`src/lib/api-response.ts`, `src/lib/logger.ts`) over new ones.
- Tailwind + existing CSS variables only — no hardcoded hex colors; use `var(--background)`, `var(--accent)`, etc. (brand accent `#2cb87a` is already `--brand-accent`).
- `async/await` only.
- Imports: React → Next → third-party → local (`@/`).
- After every task: `npx tsc --noEmit` then `npm run lint`.
- Never edit Supabase schema by hand — always a new file under `supabase/migrations/`.
- Contact email for all legal pages: `privacy@joben.eu` for privacy-specific requests (per user's task spec), `duku@joben.eu` stays as the general contact already used elsewhere — keep both, privacy-specific requests route to `privacy@joben.eu`.
- Production Supabase is **self-hosted** on the project's own VPS (see `docker-compose.prod.yml` / deployment docs), not the hosted supabase.com service — the privacy policy must reflect this (no third-party sub-processor for core DB storage, unlike Anthropic/Stripe/Resend/PostHog/Upstash/Vercel which are genuine third parties).
- Do not fabricate features that don't exist: there is no Resend "Audience"/contact-list integration in this codebase (confirmed in audit) — do not add fake contact-list removal code; document its absence instead.

---

## Audit Summary (Phase 1 — already complete, informs every task below)

- **Auth**: Clerk only. Supabase is accessed exclusively via the service-role key (`src/lib/supabase/server.ts`) — RLS is currently cosmetic since the app never uses the anon key, but per the task spec every user-data table still needs RLS enabled as defense-in-depth.
- **Missing RLS**: `email_events`, `resume_analyses`, `feedback` have **no RLS at all**. `webhook_events`/`product_events` have RLS enabled with zero policies (already safe — default-deny).
- **Account deletion is broken**: the Settings page "Delete Account" button (`src/app/settings/page.tsx:113-115`) has no `onClick` — it does nothing. The only working deletion path is the Clerk `user.deleted` webhook (`src/app/api/webhooks/clerk/route.ts:239-255`), which deletes only the `users` row and orphans `resumes`, `cover_letters`, `ai_reviews`, `resume_analyses`, `email_events`, `feedback`. It never cancels Stripe subscriptions.
- **No data export exists** anywhere in the codebase.
- **No cookie consent banner exists.** PostHog (`src/instrumentation-client.ts`) and Vercel Analytics (`src/app/layout.tsx:147`) both load and track unconditionally on every page.
- **Logging is clean**: reviewed every `logger.*`/`console.*` call across the 8 CV-touching API routes — none log raw resume/CV text or request bodies. The real leak vector is Sentry: `sendDefaultPii: true` in all three configs (`sentry.server.config.ts`, `sentry.edge.config.ts`, `src/instrumentation-client.ts`) with no `beforeSend` scrubbing, combined with `onRequestError = Sentry.captureRequestError` in `src/instrumentation.ts` — an uncaught exception on a CV-processing route could forward the raw request body to Sentry.
- **IP as PII**: `src/lib/security/route-rate-limit.ts:73-79` uses the raw client IP as a Redis key (`ip:${ip}`) when no authenticated user is present.
- **Unused PII collection**: `users.avatar_url` is written on every Clerk webhook (`user.created`/`user.updated`) but never read anywhere in the app.
- **No footer exists in the shared layout** — the only footer is homepage-only (`src/app/page.tsx:301-314`, content from `src/lib/content.ts:238-243`), linking to `/terms` and `/privacy` but not a `/cookies` page (which doesn't exist).
- No PII found in URL query params. No auth tokens in localStorage (Clerk manages its own httpOnly session cookies).

---

### Task 1: Rewrite `/privacy` page content

**Files:**
- Modify: `src/app/privacy/page.tsx` (the `sections` array, lines 37-103)

**Interfaces:** None — content-only change, same `sections.map()` render already in the file (lines 119-125).

- [ ] **Step 1: Replace the `sections` array** with GDPR-complete content. Keep the exact same array shape (`{ title, content }`) and rendering — only the content changes. Use this data (adjust wording to match brand voice, keep section numbers sequential):

```ts
const lastUpdated = 'July 12, 2026'

const sections = [
  {
    title: '1. Scope',
    content:
      'This Privacy Policy explains how Joben ("we", "us") collects, uses, stores, and shares your personal data when you use joben.eu and our AI resume-building services, in accordance with the EU General Data Protection Regulation (GDPR).',
  },
  {
    title: '2. Data We Collect',
    content:
      'Account data: email address, first/last name, and profile avatar URL, collected via Clerk when you sign up. Resume and cover letter content: the full text and structured data you enter into the builder (work history, education, skills). AI analysis results: scores and feedback generated when you run an AI review. Billing metadata: your Stripe customer ID and subscription ID (we never see or store your card number — Stripe handles that directly). Usage analytics: pseudonymous product-usage events (e.g. feature used, plan tier) tied to your account ID, collected only after you accept analytics cookies. Technical/error logs: request identifiers, error messages, and, when an unhandled error occurs, your IP address (via our error-monitoring provider). Feedback: if you submit our in-app feedback form, your email address and free-text responses.',
  },
  {
    title: '3. How We Use Data',
    content:
      'To provide the core resume-building and AI-review service you signed up for; to process payments; to detect and prevent abuse (rate limiting); to send service emails (welcome, inactivity reminders, feedback requests); to fix bugs via error monitoring; and, only with your consent, to understand product usage through analytics.',
  },
  {
    title: '4. AI Processing',
    content:
      'When you use an AI feature (resume analysis, tailoring, cover letter generation, bullet rewriting), the relevant resume or job-description text you provide is sent to Anthropic ("Claude"), our AI provider, solely to generate that output. We do not send your name or email to Anthropic — only the document content needed for the specific request. Anthropic does not use API inputs to train its models by default.',
  },
  {
    title: '5. Sub-Processors',
    content:
      'We share data with the following providers, each acting as a data processor under its own data processing agreement: Anthropic (AI processing of resume/CV text, USA), Stripe (payment processing, global/USA), Resend (transactional email delivery, USA), PostHog (product analytics, EU-hosted instance, only with consent), Upstash (rate-limiting cache, USA), Vercel (application hosting, global/USA), Sentry (error monitoring, EU-hosted instance). Our core database (Supabase/Postgres) is self-hosted on our own infrastructure — it is not a third-party sub-processor.',
  },
  {
    title: '6. Legal Bases',
    content:
      'Contract performance: account creation, resume/cover letter storage, AI features, and billing — necessary to provide the service you signed up for. Legitimate interest: fraud/abuse prevention (rate limiting), error monitoring, and service emails directly related to your account. Consent: analytics cookies (PostHog), which only load after you accept them in the cookie banner. Legal obligation: retaining billing records where required by tax law.',
  },
  {
    title: '7. Data Retention',
    content:
      'Account, resume, cover letter, and AI-analysis data: retained while your account is active and deleted immediately when you delete your account. Billing records: retained by Stripe per their own compliance requirements. Feedback submissions: retained for 24 months. Webhook and analytics event logs: retained for up to 12 months for security and debugging, then purged. Error-monitoring logs (Sentry): retained per our provider\'s default 90-day window. Rate-limiting data (Redis): expires automatically within hours to a month depending on the limit window.',
  },
  {
    title: '8. Security',
    content:
      'We use encryption in transit (TLS) for all traffic, restrict database access to server-side service credentials only, and apply row-level security policies on every table holding personal data. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
  },
  {
    title: '9. Your Rights',
    content:
      'Under the GDPR you have the right to: access the personal data we hold about you (use "Export My Data" in Settings for an instant JSON export); request deletion of your account and all associated data (use "Delete Account" in Settings, which is processed immediately); rectify inaccurate data (update it directly in the app or contact us); object to or restrict certain processing, such as analytics (use the cookie banner or contact us); and data portability (the export above is provided in a structured, machine-readable JSON format). To exercise any right not available directly in the app, email privacy@joben.eu. You also have the right to lodge a complaint with your local data protection supervisory authority.',
  },
  {
    title: '10. Cookies and Similar Technologies',
    content:
      'We use strictly necessary cookies to keep you signed in and secure the service, and, only if you accept them via our cookie banner, analytics cookies to understand product usage. See our full Cookie Policy for the complete list of cookies, their purpose, and how to change your choice at any time.',
  },
  {
    title: '11. International Data Transfers',
    content:
      'Some of our sub-processors (Anthropic, Stripe, Resend, Upstash, Vercel) are based in or process data in the United States. Where we transfer personal data outside the European Economic Area, we rely on the European Commission\'s Standard Contractual Clauses (SCCs) or an equivalent adequacy safeguard offered by that provider.',
  },
  {
    title: '12. Children\'s Privacy',
    content:
      'Joben is not directed at, and we do not knowingly collect data from, anyone under 16 years old, the minimum age required to use our services under these terms. If you believe a minor has provided us personal data, contact us and we will delete it.',
  },
  {
    title: '13. Changes to This Policy',
    content:
      'We may update this policy periodically. Material changes will be reflected by an updated "Last updated" date above; continued use after an update means you acknowledge the revised version.',
  },
  {
    title: '14. Contact',
    content:
      'For privacy requests or questions, contact us at privacy@joben.eu.',
  },
]
```

- [ ] **Step 2: Update `lastUpdated`** to `'July 12, 2026'` (already shown above).
- [ ] **Step 3: Visual check** — run `npm run dev`, open `http://localhost:3000/privacy`, confirm all 14 sections render with the existing card styling (no layout changes needed, only content).
- [ ] **Step 4: Verify** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit**

```bash
git add src/app/privacy/page.tsx
git commit -m "docs(legal): expand privacy policy for GDPR compliance"
```

---

### Task 2: Rewrite `/terms` page content

**Files:**
- Modify: `src/app/terms/page.tsx` (the `sections` array, lines 37-98)

- [ ] **Step 1: Replace the `sections` array**, keeping the existing 12 sections' intent but adding the missing GDPR/legal requirements — minimum age, no-employment-guarantee, governing law:

```ts
const lastUpdated = 'July 12, 2026'

const sections = [
  {
    title: '1. Acceptance of These Terms',
    content:
      'By accessing or using Joben, you agree to these Terms and Conditions. If you do not agree, do not use the service.',
  },
  {
    title: '2. Eligibility and Accounts',
    content:
      'You must be at least 16 years old to use Joben. You must provide accurate account information and keep your login credentials secure. You are responsible for activity under your account.',
  },
  {
    title: '3. Description of Services',
    content:
      'Joben provides resume and cover letter tools, AI-powered analysis, and export features. Features and limits may depend on your plan.',
  },
  {
    title: '4. No Guarantee of Employment Outcomes',
    content:
      'Joben is a resume-writing and optimization tool. We do not guarantee interviews, job offers, or any specific employment outcome. AI-generated scores and suggestions are informational aids, not a promise of results.',
  },
  {
    title: '5. Billing, Upgrades, and Refunds',
    content:
      'Paid plans are billed according to the pricing shown at checkout. Taxes may apply. Unless required by law, fees are non-refundable.',
  },
  {
    title: '6. Acceptable Use',
    content:
      'You agree not to use Joben for unlawful, abusive, or fraudulent activity, and not to attempt unauthorized access, disruption, or misuse of the platform.',
  },
  {
    title: '7. AI Output Disclaimer',
    content:
      'AI-generated suggestions are produced by processing your resume and job-description text through a third-party AI provider (Anthropic). Outputs are provided for informational purposes only. You are responsible for reviewing, editing, and validating all generated content before use, including for accuracy.',
  },
  {
    title: '8. Your Content',
    content:
      'You retain ownership of content you upload or create. You grant us a limited license to process that content — including sending it to our AI provider — only to provide, maintain, and improve the service.',
  },
  {
    title: '9. Intellectual Property',
    content:
      'The Joben platform, branding, software, and related materials are protected by intellectual property laws and remain the property of Joben and its licensors.',
  },
  {
    title: '10. Suspension and Termination',
    content:
      'We may suspend or terminate access for violations of these terms, security risks, non-payment, or legal requirements. You may delete your account at any time from Settings.',
  },
  {
    title: '11. Disclaimers and Limitation of Liability',
    content:
      'The service is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Joben is not liable for indirect, incidental, or consequential damages, including loss of employment opportunity.',
  },
  {
    title: '12. Governing Law',
    content:
      'These terms are governed by the laws of the European Union and the jurisdiction in which Joben is established, without regard to conflict-of-law principles, without prejudice to any mandatory consumer-protection rights you have under the law of your country of residence.',
  },
  {
    title: '13. Changes to Terms',
    content:
      'We may update these terms from time to time. Continued use after updates means you accept the revised terms.',
  },
  {
    title: '14. Contact',
    content:
      'For legal or privacy-related questions, contact us at privacy@joben.eu.',
  },
]
```

- [ ] **Step 2: Visual check** at `http://localhost:3000/terms`.
- [ ] **Step 3: Verify** — `npx tsc --noEmit`.
- [ ] **Step 4: Commit**

```bash
git add src/app/terms/page.tsx
git commit -m "docs(legal): expand terms of service for GDPR compliance"
```

---

### Task 3: Create `/cookies` page

**Files:**
- Create: `src/app/cookies/page.tsx`

**Interfaces:** Mirrors the exact structure of `src/app/privacy/page.tsx` (same `Navbar`, header card, `sections.map()` pattern, same Tailwind classes) so it matches site design pixel-for-pixel.

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Joben AI Resume Builder',
  description: 'Learn what cookies Joben uses, why, and how to control them.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Cookie Policy | Joben AI Resume Builder',
    description: 'Learn what cookies Joben uses, why, and how to control them.',
    url: '/cookies',
    siteName: 'Joben',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Joben AI Resume Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cookie Policy | Joben AI Resume Builder',
    description: 'Learn what cookies Joben uses, why, and how to control them.',
    images: ['/og-image.png'],
  },
}

const lastUpdated = 'July 12, 2026'

type CookieRow = {
  name: string
  provider: string
  purpose: string
  duration: string
}

const necessaryCookies: CookieRow[] = [
  { name: '__session', provider: 'Clerk', purpose: 'Keeps you signed in.', duration: 'Session' },
  { name: '__client_uat', provider: 'Clerk', purpose: 'Syncs sign-in state across tabs.', duration: '1 year' },
  { name: '__clerk_db_jwt', provider: 'Clerk', purpose: 'Authentication token used to secure your session.', duration: 'Session' },
]

const analyticsCookies: CookieRow[] = [
  { name: 'ph_*', provider: 'PostHog', purpose: 'Pseudonymous product analytics (feature usage, page views). Only set after you accept analytics cookies.', duration: 'Up to 1 year' },
  { name: '_vercel_*', provider: 'Vercel Analytics', purpose: 'Aggregate, privacy-friendly page-view analytics. Only set after you accept analytics cookies.', duration: 'Up to 1 year' },
]

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[#FFFFFF]/60">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Provider</th>
            <th className="pb-2 pr-4 font-medium">Purpose</th>
            <th className="pb-2 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-white/10">
              <td className="py-2 pr-4 font-mono text-xs text-[#FFFFFF]/90">{row.name}</td>
              <td className="py-2 pr-4 text-[#FFFFFF]/80">{row.provider}</td>
              <td className="py-2 pr-4 text-[#FFFFFF]/80">{row.purpose}</td>
              <td className="py-2 text-[#FFFFFF]/80">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <header className="mb-8 rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
          <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">Last updated: {lastUpdated}</p>
          <p className="mt-4 text-[#FFFFFF]/82">
            This page lists every cookie Joben sets, why, and how long it lasts. You can change your choice at any
            time by clearing your browser&apos;s local storage for this site, or by using the cookie banner shown on
            your first visit.
          </p>
        </header>

        <article className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Strictly Necessary</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              These cookies are required for the site to function — primarily keeping you signed in. They cannot be
              disabled and are not subject to consent under GDPR/ePrivacy.
            </p>
            <CookieTable rows={necessaryCookies} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Analytics (Optional)</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              These cookies help us understand how the product is used so we can improve it. They are only set after
              you click &quot;Accept all&quot; in the cookie banner, and never before.
            </p>
            <CookieTable rows={analyticsCookies} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Marketing</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              We do not use marketing or advertising cookies.
            </p>
          </section>
        </article>

        <p className="mt-8 text-sm text-[#FFFFFF]/60">
          Read our <Link href="/privacy" className="text-[#16DB65] hover:text-[#0A9548]">Privacy Policy</Link> for
          how we handle personal data more broadly.
        </p>
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Visual check** at `http://localhost:3000/cookies` — table renders, matches site dark theme.
- [ ] **Step 3: Verify** — `npx tsc --noEmit`.
- [ ] **Step 4: Commit**

```bash
git add src/app/cookies/page.tsx
git commit -m "feat(legal): add cookie policy page"
```

---

### Task 4: Cookie consent state + PostHog opt-in gate

**Files:**
- Create: `src/lib/cookie-consent.ts`
- Modify: `src/instrumentation-client.ts`

**Interfaces:**
- Produces: `COOKIE_CONSENT_KEY: string`, `type CookieConsent = 'accepted' | 'rejected'`, `getCookieConsent(): CookieConsent | null`, `setCookieConsent(value: CookieConsent): void`, `COOKIE_CONSENT_EVENT: string` (a `window` custom event name fired on every `setCookieConsent` call so other mounted components — the analytics gate — can react without a shared React context).
- Consumes (Task 5): `CookieConsentBanner` reads/writes via these exports; `AnalyticsGate` reads via `getCookieConsent()` and listens for `COOKIE_CONSENT_EVENT`.

- [ ] **Step 1: Create `src/lib/cookie-consent.ts`**

```ts
export type CookieConsent = 'accepted' | 'rejected'

export const COOKIE_CONSENT_KEY = 'joben_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'joben-cookie-consent-changed'

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY)
  return value === 'accepted' || value === 'rejected' ? value : null
}

export function setCookieConsent(value: CookieConsent): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(COOKIE_CONSENT_KEY, value)
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: value }))
}
```

- [ ] **Step 2: Gate PostHog behind consent in `src/instrumentation-client.ts`** — replace lines 8-19:

```ts
import posthog from 'posthog-js'
import * as Sentry from "@sentry/nextjs";
import { getCookieConsent } from '@/lib/cookie-consent'

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

if (posthogProjectToken) {
  posthog.init(posthogProjectToken, {
    api_host: '/ingest',
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    disable_session_recording: false,
    opt_out_capturing_by_default: getCookieConsent() !== 'accepted',
  })
}
```

  This makes PostHog initialize (so it's ready to go) but capture nothing until `posthog.opt_in_capturing()` is called by the banner (Task 5) — satisfies "blocks PostHog... until consent is given" without a race between script load and banner render.

- [ ] **Step 3: Verify** — `npx tsc --noEmit`.
- [ ] **Step 4: Commit**

```bash
git add src/lib/cookie-consent.ts src/instrumentation-client.ts
git commit -m "feat(gdpr): add cookie consent state and gate PostHog capture on it"
```

---

### Task 5: Cookie consent banner + analytics gate, wired into layout

**Files:**
- Create: `src/components/CookieConsentBanner.tsx`
- Create: `src/components/AnalyticsGate.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `getCookieConsent`, `setCookieConsent`, `COOKIE_CONSENT_EVENT` from `@/lib/cookie-consent` (Task 4).
- `CookieConsentBanner`: no props, renders `null` once a choice exists.
- `AnalyticsGate`: no props, wraps `<Analytics />` from `@vercel/analytics/next`, renders it only when consent is `'accepted'`.

- [ ] **Step 1: Create `src/components/CookieConsentBanner.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import posthog from 'posthog-js'
import { getCookieConsent, setCookieConsent } from '@/lib/cookie-consent'

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(getCookieConsent() === null)
  }, [])

  if (!visible) return null

  const handleAccept = () => {
    setCookieConsent('accepted')
    posthog.opt_in_capturing()
    setVisible(false)
  }

  const handleReject = () => {
    setCookieConsent('rejected')
    posthog.opt_out_capturing()
    setVisible(false)
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-(--border) bg-(--surface) px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-(--muted)">
          We use strictly necessary cookies to run Joben, and optional analytics cookies to improve it. See our{' '}
          <Link href="/cookies" className="text-(--accent) hover:text-(--accent-strong)">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            onClick={handleReject}
            className="flex-1 rounded-md border border-(--border) px-4 py-2 text-sm font-medium text-(--foreground) hover:bg-(--surface-elevated) sm:flex-none"
          >
            Reject non-essential
          </button>
          <button
            onClick={handleAccept}
            className="flex-1 rounded-md bg-(--accent) px-4 py-2 text-sm font-medium text-(--background) hover:bg-(--accent-strong) sm:flex-none"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
```

  Both buttons use the same padding/sizing classes (`rounded-md px-4 py-2 text-sm font-medium`) — equal visual weight, differing only by fill vs. outline, satisfying the "no dark pattern" requirement.

- [ ] **Step 2: Create `src/components/AnalyticsGate.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { COOKIE_CONSENT_EVENT, getCookieConsent } from '@/lib/cookie-consent'

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(getCookieConsent() === 'accepted')

    const handleChange = (event: Event) => {
      const detail = (event as CustomEvent<string>).detail
      setEnabled(detail === 'accepted')
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, handleChange)
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, handleChange)
  }, [])

  if (!enabled) return null
  return <Analytics />
}
```

- [ ] **Step 3: Wire into `src/components/ClientProviders.tsx`** (NOT `layout.tsx` — as of 2026-07-12 a `ClientProviders` wrapper was introduced that now owns `<Analytics />`, `<SpeedInsights />`, `<GoogleTagManager />`, and `<PostHogProvider>`; `layout.tsx` just renders `<ClientProviders>{children}</ClientProviders>`. This plan section is stale relative to that refactor — use this diff, not one against `layout.tsx`):

```diff
 import { Analytics } from '@vercel/analytics/next'
+import { AnalyticsGate } from '@/components/AnalyticsGate'
 import { SpeedInsights } from '@vercel/speed-insights/next'
 import { GoogleTagManager } from '@next/third-parties/google'
 import { PostHogProvider } from '@/components/PostHogProvider'
 import { WebVitalsReporter } from '@/components/WebVitalsReporter'
```

  and in the JSX:

```diff
     <PostHogProvider>
       {children}
       <WebVitalsReporter />
-      <Analytics />
+      <AnalyticsGate />
       <SpeedInsights />
       {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
     </PostHogProvider>
```

  Leave the `GoogleTagManager` line itself untouched here — Task 5b (below) gates it via Google Consent Mode `gtag('consent', ...)` signals instead of a React-level render gate, since GTM's own tags (not just Analytics) need to keep loading unconditionally and self-suppress based on consent state.

- [ ] **Step 4: Add `<CookieConsentBanner />` to `src/app/layout.tsx`** (this one *is* layout.tsx, since the banner is page chrome, not a tracking provider) — add the import and render it as a sibling of `<ClientProviders>`, inside `<body>`:

```diff
 import { ClientProviders } from '@/components/ClientProviders'
+import { CookieConsentBanner } from '@/components/CookieConsentBanner'
```

```diff
           <ClientProviders>
             {children}
           </ClientProviders>
+          <CookieConsentBanner />
         </body>
```

- [ ] **Step 5: Manual test** — `npm run dev`, open the site in a fresh incognito window (or clear localStorage), confirm the banner appears pinned to the bottom with two equal-weight buttons, links to `/cookies` work, and after clicking either button the banner disappears and does not reappear on reload. Open DevTools → Application → Local Storage and confirm `joben_cookie_consent` is set to `accepted` or `rejected`.
- [ ] **Step 6: Verify** — `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 7: Commit**

```bash
git add src/components/CookieConsentBanner.tsx src/components/AnalyticsGate.tsx src/components/ClientProviders.tsx src/app/layout.tsx
git commit -m "feat(gdpr): add cookie consent banner and gate Vercel Analytics on consent"
```

---

### Task 5b: Google Consent Mode for GTM/GA4

**Why this task exists:** GTM (`GTM-59C3XZ9H`, added 2026-07-12, see `src/components/ClientProviders.tsx`) contains a "Google Tag" pointed at GA4 (`G-FBR6C4DH8B`). Every Google Tag has **Built-In Consent Checks** (`ad_storage`, `ad_personalization`, `ad_user_data`, `analytics_storage`) that GTM enforces automatically and cannot be turned off from the tag's settings — this is a Google platform requirement, not something this codebase configured. Confirmed live 2026-07-13: with zero `gtag('consent', ...)` calls anywhere on the site, GA4 Realtime showed 0 users from three independent test devices even though the tag was firing (visible in GTM's own container diagnostics) — Google was silently suppressing full measurement because it never received a consent signal. Task 4/5 above gate PostHog (`opt_out_capturing_by_default`) and Vercel Analytics (`AnalyticsGate`), but neither of those mechanisms speaks Google's Consent Mode protocol — GTM/GA4 needs its own explicit `dataLayer` consent signal, independent of those two gates. Without this task, GA4 stays at 0 data even after Task 4/5 ship.

**Files:**
- Create: `src/lib/consent-mode.ts`
- Modify: `src/app/layout.tsx`
- Modify: `src/components/CookieConsentBanner.tsx`

**Interfaces:**
- Produces: `CONSENT_MODE_DEFAULT_SCRIPT: string` (inline JS source, pushed to `window.dataLayer` before GTM's own script runs), `pushConsentUpdate(accepted: boolean): void` (called by the banner's Accept/Reject handlers).
- Consumes (in `CookieConsentBanner.tsx`): `pushConsentUpdate` alongside the existing `posthog.opt_in_capturing()`/`opt_out_capturing()` calls — both gates fire together from the same button click.

- [ ] **Step 1: Create `src/lib/consent-mode.ts`**

```ts
// Google Consent Mode v2. GTM's "Google Tag" (GA4) has built-in consent
// checks (ad_storage, ad_personalization, ad_user_data, analytics_storage)
// that it enforces regardless of app code — with no signal at all, Google
// defaults EU traffic to denied and silently drops full measurement instead
// of erroring, which is why GA4 showed 0 users despite the tag firing.
// This sets an explicit deny-by-default baseline (GDPR-correct: no tracking
// until the user opts in) and updates it when the cookie banner is answered.
export const CONSENT_MODE_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied'
});
`

export function pushConsentUpdate(accepted: boolean): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push([
    'consent',
    'update',
    {
      // Joben runs no ads/remarketing — only analytics_storage actually
      // varies with the user's choice; the ad_* signals stay denied.
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: accepted ? 'granted' : 'denied',
    },
  ])
}

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}
```

- [ ] **Step 2: Load the default-consent script BEFORE GTM in `src/app/layout.tsx`** — this must run earlier than `GoogleTagManager`'s own script (which lives inside `ClientProviders`, rendered later in the tree), so add it via the same `beforeInteractive` `<Script>` pattern already used for `stripInjectedAttrScript` in this file:

```diff
 import { clerkAppearance } from '@/lib/clerk-appearance'
 import { validateEnv } from '@/lib/env'
 import { ClientProviders } from '@/components/ClientProviders'
 import { CookieConsentBanner } from '@/components/CookieConsentBanner'
+import { CONSENT_MODE_DEFAULT_SCRIPT } from '@/lib/consent-mode'
```

```diff
         <body className={...} suppressHydrationWarning>
+          <Script
+            id="consent-mode-default"
+            strategy="beforeInteractive"
+            dangerouslySetInnerHTML={{ __html: CONSENT_MODE_DEFAULT_SCRIPT }}
+          />
           <Script
             id="strip-browser-injected-bis-attr"
             strategy="beforeInteractive"
```

  Order matters: this script must be the first `beforeInteractive` script in the file (or at least precede `ClientProviders`/GTM) so `window.dataLayer` has the `consent default` command queued before `gtm.js` reads it.

- [ ] **Step 3: Call `pushConsentUpdate` from `CookieConsentBanner.tsx`'s handlers** (alongside the existing PostHog calls from Task 5):

```diff
+import { pushConsentUpdate } from '@/lib/consent-mode'
```

```diff
   const handleAccept = () => {
     setCookieConsent('accepted')
     posthog.opt_in_capturing()
+    pushConsentUpdate(true)
     setVisible(false)
   }

   const handleReject = () => {
     setCookieConsent('rejected')
     posthog.opt_out_capturing()
+    pushConsentUpdate(false)
     setVisible(false)
   }
```

- [ ] **Step 4: Manual test with GTM Preview mode** (GA4 Realtime alone isn't a reliable verification signal — it can take minutes and silently drops denied-consent hits with no error). In GTM (`GTM-59C3XZ9H`) click **Preview**, connect to `https://www.joben.eu` (or a preview deployment URL), and in the connected Tag Assistant session:
  - On first load (no consent answered yet): confirm the GA4 tag shows as fired but check the tag's "Consent Status" in Tag Assistant — should show `analytics_storage: denied`.
  - Click "Accept all" in the cookie banner, trigger a page navigation, and confirm a new GA4 event fires with `analytics_storage: granted`.
  - Click "Reject non-essential" (fresh incognito) and confirm `analytics_storage` stays `denied` and PostHog also stops capturing (Network tab, no new `/ingest` calls).
- [ ] **Step 5: Verify** — `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 6: Commit**

```bash
git add src/lib/consent-mode.ts src/app/layout.tsx src/components/CookieConsentBanner.tsx
git commit -m "feat(gdpr): wire Google Consent Mode signals for GTM/GA4"
```

---

### Task 6: RLS migration for `email_events`, `resume_analyses`, `feedback`

**Files:**
- Create: `supabase/migrations/20260712120000_add_missing_rls_policies.sql`

**Interfaces:** None — pure SQL, follows the exact pattern already used in `supabase/migrations/20260412220150_init_core_schema.sql:98-130` (`auth.jwt() ->> 'sub'` matched against the Clerk-id column).

- [ ] **Step 1: Create the migration file**

```sql
-- Defense-in-depth: these three tables store user-linked PII (email,
-- AI analysis of resume content, feedback free-text) but were created
-- without RLS. The app only ever accesses Supabase via the service-role
-- key (which bypasses RLS), so this does not change current app behavior —
-- it closes the gap for any future client-side or anon-key access path.

alter table public.email_events enable row level security;

drop policy if exists email_events_select_own on public.email_events;
create policy email_events_select_own on public.email_events
for select
using (user_clerk_id = (auth.jwt() ->> 'sub'));

alter table public.resume_analyses enable row level security;

drop policy if exists resume_analyses_rw_own on public.resume_analyses;
create policy resume_analyses_rw_own on public.resume_analyses
for all
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

alter table public.feedback enable row level security;

drop policy if exists feedback_select_own on public.feedback;
create policy feedback_select_own on public.feedback
for select
using (user_id = (auth.jwt() ->> 'sub'));
```

- [ ] **Step 2: Apply locally** — `npx supabase db push` (or `npx supabase migration up` per the local dev workflow already documented in CLAUDE.md).
- [ ] **Step 3: Verify existing app behavior is unaffected** — run `npm run dev`, sign in, confirm resume analysis, feedback submission, and email-triggering flows (e.g. sign-up welcome email) still work end-to-end (all app reads/writes go through the service-role key, which bypasses RLS, so this should be a no-op for the app itself).
- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260712120000_add_missing_rls_policies.sql
git commit -m "fix(security): enable RLS on email_events, resume_analyses, feedback tables"
```

---

### Task 7: Delete Account — API route

**Files:**
- Create: `src/app/api/account/delete/route.ts`
- Test: `tests/api/account-delete.test.ts`

**Interfaces:**
- Produces: `POST /api/account/delete` → `NextResponse` with `apiSuccess({ deleted: true })` (200) or `apiError(message, status)` (401/500), using the existing `apiSuccess`/`apiError` helpers from `src/lib/api-response.ts`.
- Consumes: `auth()` from `@clerk/nextjs/server`, `clerkClient()` from `@clerk/nextjs/server`, `createServerClient()` from `@/lib/supabase/server`, `stripe` (new `Stripe` instance, same pattern as `src/app/api/webhooks/stripe/route.ts:7-9`), `logger` from `@/lib/logger`.

- [ ] **Step 1: Write the route**

```ts
import { auth, clerkClient } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

const OWNED_TABLES = ['resume_analyses', 'ai_reviews', 'resumes', 'cover_letters', 'feedback'] as const

export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401)
  }

  const supabase = createServerClient()

  const { data: user, error: userLookupError } = await supabase
    .from('users')
    .select('stripe_subscription_id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (userLookupError) {
    logger.error('Account deletion: user lookup failed', { userId, error: userLookupError.message })
    return apiError('Could not process account deletion.', 500)
  }

  if (user?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(user.stripe_subscription_id)
    } catch (error) {
      // Already-canceled or missing subscriptions must not block deletion.
      logger.warn('Account deletion: Stripe subscription cancel failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  for (const table of OWNED_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) {
      logger.error('Account deletion: row delete failed', { userId, table, error: error.message })
      return apiError('Could not process account deletion.', 500)
    }
  }

  const { error: emailEventsError } = await supabase.from('email_events').delete().eq('user_clerk_id', userId)
  if (emailEventsError) {
    logger.error('Account deletion: email_events delete failed', { userId, error: emailEventsError.message })
    return apiError('Could not process account deletion.', 500)
  }

  const { error: userDeleteError } = await supabase.from('users').delete().eq('clerk_id', userId)
  if (userDeleteError) {
    logger.error('Account deletion: users row delete failed', { userId, error: userDeleteError.message })
    return apiError('Could not process account deletion.', 500)
  }

  try {
    const client = await clerkClient()
    await client.users.deleteUser(userId)
  } catch (error) {
    // Supabase data is already gone at this point; log so we can manually
    // clean up the Clerk account, but don't fail the request — the user's
    // data has been erased, which is the GDPR-relevant outcome.
    logger.error('Account deletion: Clerk user delete failed', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }

  logger.info('Account deleted', { userId })
  return apiSuccess({ deleted: true })
}
```

  Note: `ai_reviews`/`resumes`/`resume_analyses` are deleted before `resumes` isn't strictly ordered by FK dependency here since `resume_analyses.resume_id` and `ai_reviews.resume_id` are `on delete set null`/`on delete set null` (see `supabase/migrations/20260412220150_init_core_schema.sql:51` and `20260421000000_add_resume_analyses_table.sql:4-5`) — deleting in any order is safe, but the list above deletes analyses/reviews before resumes for clarity.

  The later async Clerk `user.deleted` webhook (`src/app/api/webhooks/clerk/route.ts:239-255`) will fire and attempt the same Supabase deletes again — this is a no-op (zero rows match) and does not error, so no idempotency changes are needed there.

- [ ] **Step 2: Write the test** at `tests/api/account-delete.test.ts`, following the existing mock pattern from `tests/api/redeem-code.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const clerkClientMock = vi.fn()
const createServerClientMock = vi.fn()
const stripeCancelMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
  clerkClient: clerkClientMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    subscriptions: { cancel: stripeCancelMock },
  })),
}))

function mockSupabaseSuccess() {
  const deleteChain = { eq: vi.fn().mockResolvedValue({ error: null }) }
  createServerClientMock.mockReturnValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: { stripe_subscription_id: null }, error: null }),
        })),
      })),
      delete: vi.fn(() => deleteChain),
    })),
  })
}

describe('POST /api/account/delete', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    clerkClientMock.mockReset()
    createServerClientMock.mockReset()
    stripeCancelMock.mockReset()
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy'
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { POST } = await import('@/app/api/account/delete/route')

    const response = await POST()
    expect(response.status).toBe(401)
  })

  it('deletes all owned rows and the Clerk user on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabaseSuccess()
    const deleteUserMock = vi.fn().mockResolvedValue({})
    clerkClientMock.mockResolvedValue({ users: { deleteUser: deleteUserMock } })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean; data?: { deleted: boolean } }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data?.deleted).toBe(true)
    expect(deleteUserMock).toHaveBeenCalledWith('user_123')
  })

  it('still deletes Supabase data even if Clerk deletion fails', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    mockSupabaseSuccess()
    clerkClientMock.mockResolvedValue({
      users: { deleteUser: vi.fn().mockRejectedValue(new Error('clerk down')) },
    })

    const { POST } = await import('@/app/api/account/delete/route')
    const response = await POST()
    const payload = (await response.json()) as { success: boolean }

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
  })
})
```

- [ ] **Step 3: Run the test** — `npx vitest run tests/api/account-delete.test.ts`. Expected: 3 passed.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit**

```bash
git add src/app/api/account/delete/route.ts tests/api/account-delete.test.ts
git commit -m "feat(gdpr): implement account deletion endpoint"
```

---

### Task 8: Delete Account — Settings UI

**Files:**
- Create: `src/components/settings/DeleteAccountButton.tsx`
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: `POST /api/account/delete` (Task 7), `useClerk().signOut` from `@clerk/nextjs`, `useRouter` from `next/navigation`, `Modal` from `@/components/ui/Modal`, `Button` from `@/components/ui/Button`.

- [ ] **Step 1: Create `src/components/settings/DeleteAccountButton.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signOut } = useClerk()
  const router = useRouter()

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch('/api/account/delete', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Deletion failed')
      }
      await signOut()
      router.push('/')
    } catch {
      setError('Something went wrong deleting your account. Please try again or contact privacy@joben.eu.')
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-body text-text-secondary">
          <Trash2 size={14} className="text-text-muted" />
          Delete account
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="border-red-400/40 text-red-400 hover:border-red-400"
          onClick={() => setOpen(true)}
        >
          Delete Account
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete your account">
        <p className="text-body text-text-secondary">
          This permanently deletes your account, all resumes, cover letters, AI reviews, and cancels any active
          subscription. This cannot be undone.
        </p>
        {error ? <p className="mt-3 text-small text-error">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="border-red-400/40 text-red-400 hover:border-red-400"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Yes, delete my account'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
```

  (Check `src/components/ui/Button.tsx` for the exact `variant`/`size` prop union before finalizing — match whatever values `variant="secondary" size="sm"` already use elsewhere in `src/app/settings/page.tsx:113`, which this component copies verbatim.)

- [ ] **Step 2: Wire into `src/app/settings/page.tsx`** — add the import and replace the danger-zone block (lines 108-116). Task 10 (a later, separate task) adds its own `ExportDataButton` import and a new row elsewhere in this file — do not add that import here:

```diff
 import { AccountUserButton } from '@/components/settings/AccountUserButton'
+import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
```

```diff
           <Divider className="my-4" />
-          <div className="flex items-center justify-between">
-            <div className="flex items-center gap-2 text-body text-text-secondary">
-              <Trash2 size={14} className="text-text-muted" />
-              Delete account
-            </div>
-            <Button variant="secondary" size="sm" className="border-red-400/40 text-red-400 hover:border-red-400">
-              Delete Account
-            </Button>
-          </div>
+          <DeleteAccountButton />
         </div>
```

  Remove the now-unused `Trash2` import from the top of the file if `DeleteAccountButton` is the only place it was used (check remaining usages first) — `Button` likely stays imported since it's still used elsewhere on the page.

- [ ] **Step 3: Manual test** — sign in as a test user with no active subscription, go to `/settings`, click "Delete Account", confirm the modal shows, click "Yes, delete my account", confirm you're signed out and redirected to `/`. Then verify in Supabase that the `users`/`resumes`/`cover_letters` rows for that Clerk ID are gone.
- [ ] **Step 4: Verify** — `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 5: Commit**

```bash
git add src/components/settings/DeleteAccountButton.tsx src/app/settings/page.tsx
git commit -m "feat(gdpr): wire up delete account flow in settings"
```

---

### Task 9: Export My Data — API route

**Files:**
- Create: `src/app/api/account/export/route.ts`
- Test: `tests/api/account-export.test.ts`

**Interfaces:**
- Produces: `GET /api/account/export` → `NextResponse` with `Content-Type: application/json`, `Content-Disposition: attachment; filename="joben-data-export-<ISO date>.json"` on success (200), or an `apiError` JSON envelope on failure (401/500).

- [ ] **Step 1: Write the route**

```ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-response'
import { logger } from '@/lib/logger'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return apiError('You must be signed in.', 401)
  }

  const supabase = createServerClient()

  const [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents] = await Promise.all([
    supabase.from('users').select('*').eq('clerk_id', userId).maybeSingle(),
    supabase.from('resumes').select('*').eq('user_id', userId),
    supabase.from('cover_letters').select('*').eq('user_id', userId),
    supabase.from('ai_reviews').select('*').eq('user_id', userId),
    supabase.from('resume_analyses').select('*').eq('user_id', userId),
    supabase.from('feedback').select('*').eq('user_id', userId),
    supabase.from('email_events').select('*').eq('user_clerk_id', userId),
  ])

  const firstError = [user, resumes, coverLetters, aiReviews, resumeAnalyses, feedback, emailEvents]
    .map((result) => result.error)
    .find(Boolean)

  if (firstError) {
    logger.error('Data export failed', { userId, error: firstError.message })
    return apiError('Could not generate your data export.', 500)
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    format: 'joben-gdpr-export-v1',
    account: user.data,
    resumes: resumes.data,
    coverLetters: coverLetters.data,
    aiReviews: aiReviews.data,
    resumeAnalyses: resumeAnalyses.data,
    feedback: feedback.data,
    emailEvents: emailEvents.data,
  }

  const filename = `joben-data-export-${new Date().toISOString().slice(0, 10)}.json`

  return new NextResponse(JSON.stringify(exportPayload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 2: Write the test** at `tests/api/account-export.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const authMock = vi.fn()
const createServerClientMock = vi.fn()

vi.mock('@clerk/nextjs/server', () => ({
  auth: authMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerClient: createServerClientMock,
}))

function mockTable(data: unknown[] | Record<string, unknown> | null) {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => (Array.isArray(data) ? Promise.resolve({ data, error: null }) : {
        maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
      })),
    })),
  }
}

describe('GET /api/account/export', () => {
  beforeEach(() => {
    vi.resetModules()
    authMock.mockReset()
    createServerClientMock.mockReset()
  })

  it('returns 401 when signed out', async () => {
    authMock.mockResolvedValue({ userId: null })
    const { GET } = await import('@/app/api/account/export/route')

    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('returns a downloadable JSON export on success', async () => {
    authMock.mockResolvedValue({ userId: 'user_123' })
    createServerClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'users') return mockTable({ clerk_id: 'user_123', email: 'a@example.com' })
        return mockTable([])
      }),
    })

    const { GET } = await import('@/app/api/account/export/route')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('Content-Disposition')).toContain('attachment')
    const body = await response.json()
    expect(body.account.email).toBe('a@example.com')
    expect(body.format).toBe('joben-gdpr-export-v1')
  })
})
```

- [ ] **Step 3: Run the test** — `npx vitest run tests/api/account-export.test.ts`. Expected: 2 passed.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit**

```bash
git add src/app/api/account/export/route.ts tests/api/account-export.test.ts
git commit -m "feat(gdpr): implement data export endpoint"
```

---

### Task 10: Export My Data — Settings UI

**Files:**
- Create: `src/components/settings/ExportDataButton.tsx`
- Modify: `src/app/settings/page.tsx`

**Interfaces:** Plain `<a>` tag pointing at `GET /api/account/export` (Task 9) — the browser handles the download via the `Content-Disposition` header, no client-side JS/fetch needed.

- [ ] **Step 1: Create `src/components/settings/ExportDataButton.tsx`**

```tsx
import { Download } from 'lucide-react'
import { buttonVariants } from '@/components/ui/Button'

export function ExportDataButton() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-body text-text-secondary">
        <Download size={14} className="text-text-muted" />
        Export my data
      </div>
      <a href="/api/account/export" className={buttonVariants('secondary', 'sm')}>
        Export My Data
      </a>
    </div>
  )
}
```

  (Confirm `buttonVariants` is exported from `src/components/ui/Button.tsx` — it's already imported that way in `src/app/page.tsx:305`. This is a server component since it has no interactivity — matches the "Account" card pattern already in `settings/page.tsx`.)

- [ ] **Step 2: Add a row for it in `src/app/settings/page.tsx`** — add the import, then insert the row inside the "Account" card, after the "Email settings" row (after line 41):

```diff
 import { AccountUserButton } from '@/components/settings/AccountUserButton'
 import { DeleteAccountButton } from '@/components/settings/DeleteAccountButton'
+import { ExportDataButton } from '@/components/settings/ExportDataButton'
```

```diff
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-body text-text-secondary">
                 <Mail size={14} className="text-text-muted" />
                 Email settings
               </div>
               <Badge variant="muted">Managed by Clerk</Badge>
             </div>
+            <ExportDataButton />
           </div>
```

  (This assumes Task 8 has already landed, adding the `DeleteAccountButton` import above it — if Task 10 is somehow implemented before Task 8, add only the `ExportDataButton` import.)

- [ ] **Step 3: Manual test** — go to `/settings`, click "Export My Data", confirm a `joben-data-export-YYYY-MM-DD.json` file downloads immediately containing your account/resume/cover-letter data.
- [ ] **Step 4: Verify** — `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 5: Commit**

```bash
git add src/components/settings/ExportDataButton.tsx src/app/settings/page.tsx
git commit -m "feat(gdpr): wire up data export flow in settings"
```

---

### Task 11: Sentry PII scrubbing

**Files:**
- Create: `src/lib/security/sentry-scrub.ts`
- Modify: `sentry.server.config.ts`
- Modify: `sentry.edge.config.ts`
- Modify: `src/instrumentation-client.ts`

**Interfaces:**
- Produces: `scrubSentryEvent(event: Sentry.ErrorEvent | Sentry.TransactionEvent): typeof event` — strips `request.data` (request body, which can contain raw CV text) from every event before it leaves the process. Shared across all three Sentry configs to avoid duplicating the same logic three times (DRY).

- [ ] **Step 1: Create `src/lib/security/sentry-scrub.ts`**

```ts
import type { ErrorEvent, TransactionEvent } from '@sentry/nextjs'

// sendDefaultPii + Sentry.captureRequestError (src/instrumentation.ts) can
// attach the raw request body to an event for an uncaught exception on any
// route — including the CV-processing routes (parse/analyze/tailor/etc.),
// whose body contains resume text. Strip it before the event leaves the
// process; IP/cookies are left intact since those are needed for abuse
// investigation and are covered as "legitimate interest" in the privacy policy.
export function scrubSentryEvent<T extends ErrorEvent | TransactionEvent>(event: T): T {
  if (event.request?.data) {
    event.request.data = '[Stripped]'
  }
  return event
}
```

- [ ] **Step 2: Wire into `sentry.server.config.ts`**

```diff
 import * as Sentry from "@sentry/nextjs";
+import { scrubSentryEvent } from "@/lib/security/sentry-scrub";

 Sentry.init({
   dsn: "https://39e304482d48c2d9aeb663a996b3d8ea@o4511258775388160.ingest.de.sentry.io/4511258779254864",
   tracesSampleRate: 1,
   enableLogs: true,
   sendDefaultPii: true,
+  beforeSend: scrubSentryEvent,
 });
```

- [ ] **Step 3: Same change in `sentry.edge.config.ts`** (identical diff).

- [ ] **Step 4: Same change in `src/instrumentation-client.ts`** — add `beforeSend: scrubSentryEvent,` to the client `Sentry.init({...})` call (after `sendDefaultPii: true,` on line 42).

- [ ] **Step 5: Manual test** — trigger a deliberate server error locally (e.g. temporarily throw inside an API route with a POST body), confirm in the Sentry dashboard (or local console if `SENTRY_DEBUG` is on) that `request.data` shows `"[Stripped]"` instead of the raw body.
- [ ] **Step 6: Verify** — `npx tsc --noEmit`.
- [ ] **Step 7: Commit**

```bash
git add src/lib/security/sentry-scrub.ts sentry.server.config.ts sentry.edge.config.ts src/instrumentation-client.ts
git commit -m "fix(security): strip request body from Sentry events"
```

---

### Task 12: Hash IP before using it as a rate-limit key

**Files:**
- Modify: `src/lib/security/route-rate-limit.ts`
- Test: `tests/security/route-rate-limit.test.ts` (create if no test file for this module already exists — check first)

**Interfaces:**
- `resolveRateLimitIdentity(req: Request, userId?: string | null): string` — same signature, same behavior, but the IP branch now returns `ip:<sha256-hex-16-chars>` instead of the raw address.

- [ ] **Step 1: Modify `resolveRateLimitIdentity`** in `src/lib/security/route-rate-limit.ts` (replace lines 68-79):

```ts
import { createHash } from 'crypto'

/**
 * Best-effort identifier resolver: prefer the authenticated userId, then
 * a hashed X-Forwarded-For client IP (hashed so raw IPs are never stored
 * as Redis key names), finally a string literal so the limiter still
 * works in development.
 */
export function resolveRateLimitIdentity(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`
  const xff = req.headers.get('x-forwarded-for') || ''
  const ip = xff.split(',')[0]?.trim()
  if (ip) return `ip:${createHash('sha256').update(ip).digest('hex').slice(0, 16)}`
  return 'ip:unknown'
}
```

  (Add the `import { createHash } from 'crypto'` at the top of the file alongside the existing import.)

- [ ] **Step 2: Check for an existing test file** — `Glob tests/**/*rate-limit*`. If `resolveRateLimitIdentity` already has test coverage, update the assertions to match a hashed value instead of a raw IP. If not, add a minimal test:

```ts
import { describe, expect, it } from 'vitest'
import { resolveRateLimitIdentity } from '@/lib/security/route-rate-limit'

describe('resolveRateLimitIdentity', () => {
  it('prefixes userId when present', () => {
    const req = new Request('http://localhost')
    expect(resolveRateLimitIdentity(req, 'user_123')).toBe('u:user_123')
  })

  it('hashes the IP instead of storing it raw', () => {
    const req = new Request('http://localhost', {
      headers: { 'x-forwarded-for': '203.0.113.42' },
    })
    const identity = resolveRateLimitIdentity(req, null)
    expect(identity.startsWith('ip:')).toBe(true)
    expect(identity).not.toContain('203.0.113.42')
    expect(identity).toBe(resolveRateLimitIdentity(req, null)) // deterministic
  })

  it('falls back to ip:unknown with no IP and no userId', () => {
    const req = new Request('http://localhost')
    expect(resolveRateLimitIdentity(req, null)).toBe('ip:unknown')
  })
})
```

- [ ] **Step 3: Run the test** — `npx vitest run tests/security/route-rate-limit.test.ts`. Expected: 3 passed.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit**

```bash
git add src/lib/security/route-rate-limit.ts tests/security/route-rate-limit.test.ts
git commit -m "fix(security): hash client IP before using it as a rate-limit key"
```

---

### Task 13: Data minimization — stop collecting unused `avatar_url`

**Files:**
- Modify: `src/app/api/webhooks/clerk/route.ts`

**Interfaces:** None — removes a field from two existing `upsert` calls.

- [ ] **Step 1: Remove `avatar_url` from the `user.created` upsert** (`src/app/api/webhooks/clerk/route.ts:99-112`) — change:

```diff
-    const { id, email_addresses, first_name, last_name, image_url } = evt.data
+    const { id, email_addresses, first_name, last_name } = evt.data
     const primaryEmail = email_addresses?.[0]?.email_address ?? null

     const { error } = await supabase.from('users').upsert(
       {
         clerk_id: id,
         email: primaryEmail,
         first_name: first_name,
         last_name: last_name,
-        avatar_url: image_url,
         plan: 'free',
       },
       { onConflict: 'clerk_id' }
     )
```

- [ ] **Step 2: Same for `user.updated`** (`src/app/api/webhooks/clerk/route.ts:209-224`):

```diff
-    const { id, email_addresses, first_name, last_name, image_url } = evt.data
+    const { id, email_addresses, first_name, last_name } = evt.data
     const primaryEmail = email_addresses?.[0]?.email_address ?? null

     const { error } = await supabase
       .from('users')
       .upsert(
         {
           clerk_id: id,
           email: primaryEmail,
           first_name: first_name,
           last_name: last_name,
-          avatar_url: image_url,
         },
         { onConflict: 'clerk_id' }
       )
```

  Leaving the existing `avatar_url` column and any already-stored values in place — dropping the column is a separate, higher-risk schema decision out of scope here; this only stops collecting new values going forward.

- [ ] **Step 3: Verify** — `npx tsc --noEmit` and `npm run lint`.
- [ ] **Step 4: Commit**

```bash
git add src/app/api/webhooks/clerk/route.ts
git commit -m "fix(gdpr): stop collecting unused avatar_url on Clerk sync"
```

---

### Task 14: Cookie policy link + GDPR compliance badge in footer

**Files:**
- Modify: `src/lib/content.ts`
- Modify: `src/app/page.tsx`

**Interfaces:** None — content/JSX additions to the existing homepage footer (the only shared footer in the codebase per the Phase 1 audit).

- [ ] **Step 1: Add a cookies link entry** — no data-shape change needed, the footer links are already hardcoded `<Link>` elements in `page.tsx`, not driven by `content.ts` — skip `content.ts`.

- [ ] **Step 2: Modify the footer in `src/app/page.tsx`** (lines 308-312) to add a `/cookies` link and a compliance note:

```diff
           <div className="mt-8 flex items-center justify-center gap-6 text-sm text-(--muted)" suppressHydrationWarning>
             <Link href="/terms" className="hover:text-(--accent)">Terms & Conditions</Link>
             <Link href="/privacy" className="hover:text-(--accent)">Privacy Policy</Link>
+            <Link href="/cookies" className="hover:text-(--accent)">Cookie Policy</Link>
           </div>
+          <p className="mt-4 text-xs text-(--muted)" suppressHydrationWarning>
+            <Link href="/privacy" className="hover:text-(--accent)">GDPR Compliant</Link> — your data, your control.
+          </p>
           <p className="mt-8 text-xs text-(--muted)" suppressHydrationWarning>{footerContent.creatorCredit}</p>
```

- [ ] **Step 3: Visual check** — homepage footer shows three legal links plus a small, subtle "GDPR Compliant" line above the creator credit — same muted text size as everything else in the footer, not a banner.
- [ ] **Step 4: Verify** — `npx tsc --noEmit`.
- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(gdpr): add cookie policy link and GDPR badge to footer"
```

---

### Task 15: Full verification pass

**Files:** None — verification only.

- [ ] **Step 1: Type check** — `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 2: Lint** — `npm run lint`. Expected: no errors.
- [ ] **Step 3: Full test suite** — `npx vitest run`. Expected: all tests pass, including the new ones from Tasks 7, 9, 12.
- [ ] **Step 4: Manual end-to-end walk** (`npm run dev`):
  - Fresh incognito visit → cookie banner appears with equal-weight buttons → "Reject non-essential" → confirm no PostHog network calls fire on subsequent navigation (Network tab, filter `/ingest`).
  - Second fresh incognito visit → "Accept all" → confirm PostHog capture calls do fire.
  - `/privacy`, `/terms`, `/cookies` render fully styled with no console errors.
  - `/settings` → "Export My Data" downloads a JSON file with real account data → "Delete Account" → confirm modal → confirm → signed out and redirected home → confirm Supabase rows are gone.
  - Footer on `/` shows Terms, Privacy, Cookie Policy links and the GDPR badge line.
- [ ] **Step 5: Update `TODO.md`** per this repo's working-methodology convention — mark the GDPR compliance items `[DONE]`.
