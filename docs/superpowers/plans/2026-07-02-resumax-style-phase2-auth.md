# ResuMax-Style Redesign — Phase 2: Auth (Sign In / Sign Up) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Joben's current sign-in/sign-up flow — which fully redirects to Clerk's externally-hosted Account Portal (`*.accounts.dev`, generic light-mode Clerk branding, completely outside this codebase's styling reach) — with embedded `<SignIn/>`/`<SignUp/>` Clerk components rendered inside a custom-styled, resumax-derived auth shell (centered card, radial accent glow, eyebrow/heading, OAuth buttons, Terms/Privacy footnote, back-to-home link). This is an architecture change, not pure CSS: it changes how `/sign-in` and `/sign-up` render, while preserving all existing behavior (return-URL handling, the mandatory legal-terms acceptance gate before sign-up, and middleware route protection).

**Architecture:** One new shared layout component, `AuthShell`, wraps both pages (logo, eyebrow, heading, subheading, radial glow background, footer links) — both `<SignIn/>` and `<SignUp/>` render inside it with their own chrome (Clerk's default card/header) stripped via `clerkAppearance` so they visually merge into `AuthShell`'s own card. `src/lib/clerk-appearance.ts` is updated from the old hardcoded-hex theme to the Phase 0/1 token hex values (Clerk's `appearance.variables` needs literal color strings, not `var(--x)` references, so this file intentionally duplicates the token hex values — same pattern already used for the "white paper" resume mockup elsewhere in this redesign). The sign-up page's legal-consent gate becomes a client-side `sessionStorage`-backed check (not page-redirect-based) so it survives Clerk's own internal path sub-navigation (e.g. an email-verification step) without re-prompting mid-flow.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, `@clerk/nextjs` v7 (`SignIn`/`SignUp` components, `fallbackRedirectUrl`/`routing`/`path`/`signUpUrl`/`signInUrl` props — verified present in the installed package's type definitions), Phase 0/1 design tokens/primitives.

## Global Constraints

- This is a genuine behavior change to authentication rendering — treat it with the care CLAUDE.md's "Critical Rules" imply for anything touching auth, even though no Clerk provider/session logic changes (only how the sign-in/sign-up UI is rendered).
- `src/middleware.ts`'s route protection (`isProtectedRoute` matcher, `auth.protect()`) is NOT modified by this plan — it already excludes `/sign-in(.*)`/`/sign-up(.*)` implicitly (they're not in the protected list).
- Two new env vars are required for `auth.protect()`'s automatic redirect (middleware-triggered, e.g. visiting `/dashboard` while signed out) to land on the new embedded pages instead of Clerk's hosted portal: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up`. These must be added to `.env.local` for local testing (already-present Clerk dev keys stay as-is) AND flagged to the user as required in their actual deployment environment (Vercel/VPS secrets) — this plan cannot set remote/production env vars, only local ones.
- No changes to `AuthAwareSignupLink`, `Navbar`, or any other component that already links to `/sign-in`/`/sign-up` — those hrefs stay correct as-is.
- Content is 100% Joben — the legal-consent checkbox text, Terms/Privacy links, and all copy stay exactly as currently written (only the visual wrapper and rendering mechanism changes).
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Add the required Clerk env vars

**Files:**
- Modify: `.env.local` (add two lines; do not touch any existing line — this file is gitignored, already contains working Clerk dev keys and placeholder Supabase values from earlier in this session)

**Interfaces:** none (environment configuration only).

- [ ] **Step 1: Append the two env vars**

Add these two lines to `.env.local` (anywhere is fine, e.g. right after the existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` lines):

```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

- [ ] **Step 2: Verify**

Run: `grep -c "NEXT_PUBLIC_CLERK_SIGN" .env.local`
Expected: `2`

Restart the dev server (`npm run dev`) after this change — Next.js only reads `.env.local` at boot, so an already-running server won't pick this up. Confirm the server starts cleanly (no new errors in the startup log beyond what was already there).

- [ ] **Step 3: No commit**

`.env.local` is gitignored — do not attempt to `git add` it (it will be a no-op or error; that's expected, not a problem). Note in your report that this env var also needs to be added to the production deployment's environment configuration by the user — this plan cannot do that remotely.

---

### Task 2: Create the `AuthShell` layout component

**Files:**
- Create: `src/components/auth/AuthShell.tsx`

**Interfaces:**
- Produces: `export function AuthShell({ eyebrow, heading, subheading, children }: AuthShellProps)`. `AuthShellProps = { eyebrow: string; heading: string; subheading: string; children: React.ReactNode }`. Tasks 4 and 5 each wrap their page content in this component.

- [ ] **Step 1: Write the component**

Create `src/components/auth/AuthShell.tsx`:

```tsx
import Image from 'next/image'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'

export interface AuthShellProps {
  eyebrow: string
  heading: string
  subheading: string
  children: React.ReactNode
}

export function AuthShell({ eyebrow, heading, subheading, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-16" suppressHydrationWarning>
      <div className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center" aria-hidden="true" suppressHydrationWarning>
        <div className="w-150 h-150 bg-(--accent)/8 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md">
        <Card elevated radius="lg" className="p-8">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image src="/jobeneu_logo.jpg" alt="Joben logo" fill sizes="32px" className="object-cover" />
            </span>
            <span className="text-xl font-bold tracking-tight text-(--foreground)">Joben</span>
          </Link>

          <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
          <h1 className="text-2xl font-bold text-(--foreground) mb-2">{heading}</h1>
          <p className="text-sm text-(--muted) mb-8">{subheading}</p>

          {children}
        </Card>

        <div className="mt-6 flex items-center justify-between text-xs text-(--muted)">
          <Link href="/" className="hover:text-(--foreground)">&larr; Back to home</Link>
          <span className="font-mono uppercase tracking-wide">ATS-Optimized &middot; AI-Powered</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/auth/AuthShell.tsx
git commit -m "feat(auth): add AuthShell layout with radial glow and card chrome"
```

---

### Task 3: Update `clerkAppearance` to Phase 0/1 tokens

**Files:**
- Modify: `src/lib/clerk-appearance.ts` (full replacement)

**Interfaces:**
- Consumes: nothing new (already imported by `ClerkProvider` in `src/app/layout.tsx`, which does not change in this task).
- Produces: the same `clerkAppearance` export shape as before (a plain object with `variables`/`elements`) — Tasks 4/5's `<SignIn/>`/`<SignUp/>` components inherit this automatically via `ClerkProvider`, no per-component appearance prop needed.

- [ ] **Step 1: Replace the file content**

Replace the full content of `src/lib/clerk-appearance.ts` with:

```ts
export const clerkAppearance = {
  variables: {
    colorBackground: 'transparent',
    colorInputBackground: '#0A0A0E',
    colorText: '#F5F1EB',
    colorTextSecondary: '#8A8A92',
    colorTextOnPrimaryBackground: '#0A0A0E',
    colorPrimary: '#2CB87A',
    colorDanger: '#EF4444',
    colorSuccess: '#4FD69B',
    colorNeutral: '#F5F1EB',
    colorInputText: '#F5F1EB',
    borderRadius: '0.625rem',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    fontWeight: { normal: 400, medium: 500, bold: 700 },
    spacingUnit: '1rem',
  },
  elements: {
    rootBox: 'w-full',
    card: 'bg-transparent shadow-none border-0 p-0 w-full',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    socialButtonsBlockButton: 'bg-(--surface-elevated) border border-(--border) text-(--foreground) hover:bg-(--border) transition-colors rounded-full',
    socialButtonsBlockButtonText: 'text-(--foreground) font-medium',
    dividerLine: 'bg-(--border)',
    dividerText: 'text-(--muted)',
    formFieldLabel: 'text-(--muted) text-xs font-medium uppercase tracking-wide',
    formFieldInput: 'bg-(--surface) border-(--border) text-(--foreground) placeholder:text-(--muted) focus:border-(--accent) rounded-lg',
    formButtonPrimary: 'bg-(--accent) hover:bg-(--accent-strong) text-(--background) font-semibold rounded-full transition-colors',
    footerActionText: 'text-(--muted)',
    footerActionLink: 'text-(--accent) hover:text-(--accent-strong) font-medium',
    identityPreviewText: 'text-(--foreground)',
    identityPreviewEditButton: 'text-(--accent)',
    formFieldErrorText: 'text-red-400 text-xs',
    alertText: 'text-(--foreground)/80',
    badge: 'bg-(--accent-muted) text-(--accent)',
  },
}
```

Implementer notes:
- `variables` uses literal hex values matching the Phase 0/1 token palette (`#0A0A0E` = `--background`, `#F5F1EB` = `--foreground`, `#2CB87A` = `--accent`, etc.) rather than `var(--x)` references — Clerk's theming variables expect plain CSS color values, and this mirrors the same "duplicate the literal hex" approach already used for the resume mockup and cover-letter "white paper" excerpts elsewhere in this redesign.
- `card: 'bg-transparent shadow-none border-0 p-0 w-full'` strips Clerk's own card chrome so `<SignIn/>`/`<SignUp/>` visually merge into `AuthShell`'s own `Card` (from Task 2) instead of nesting a second, redundant card.
- `headerTitle`/`headerSubtitle` are set to `'hidden'` because `AuthShell` renders its own heading/subheading — without hiding Clerk's defaults, the page would show two headings.
- Do NOT add a `footer: 'hidden'` override — Clerk's own footer area includes "Secured by Clerk" attribution, which should stay visible (not a licensing concern to remove casually; leave it at Clerk's default styling, just themed via the other `elements` keys, which will pick up the same tokens automatically since it isn't overridden).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/lib/clerk-appearance.ts
git commit -m "feat(auth): update clerkAppearance to Phase 0/1 design tokens"
```

---

### Task 4: Rebuild the sign-in page with an embedded `<SignIn/>`

**Files:**
- Modify: `src/app/sign-in/[[...sign-in]]/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `AuthShell` (Task 2), `SignIn` from `@clerk/nextjs`.

- [ ] **Step 1: Replace the file content**

Replace the full content of `src/app/sign-in/[[...sign-in]]/page.tsx` with:

```tsx
"use client"

import { Suspense } from 'react'
import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'

function sanitizeReturnBackUrl(value: string | null): string {
  if (!value) return '/dashboard'
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return '/dashboard'
  return trimmed
}

function SignInContent() {
  const searchParams = useSearchParams()
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'))

  return (
    <AuthShell eyebrow="Sign in" heading="Continue to Joben" subheading="Sign in to your account to keep building.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl={returnBackUrl} />
    </AuthShell>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  )
}
```

Implementer notes:
- This replaces the OLD server-component page (which called `auth().redirectToSignIn()` and redirected to Clerk's hosted portal) with a client component rendering `<SignIn/>` inline.
- `useSearchParams()` requires a `<Suspense>` boundary in the Next.js App Router (a build-time requirement, not optional) — the `Suspense` wrapper here is required, not decorative.
- `sanitizeReturnBackUrl` is a local copy of the same validation logic already used by the sign-up page (Task 5) — duplicated intentionally (2 small, independent, differently-scoped pages; not worth extracting to a shared util for two call sites of a 4-line function).
- The `[[...sign-in]]` catch-all folder name is unchanged and still required — Clerk's `routing="path"` mode needs the catch-all to handle its own internal sub-routes (e.g. an MFA step) while staying on this same page component.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add "src/app/sign-in/[[...sign-in]]/page.tsx"
git commit -m "feat(auth): render SignIn inline inside AuthShell instead of redirecting to hosted portal"
```

---

### Task 5: Rebuild the sign-up page with an embedded `<SignUp/>` and a `sessionStorage`-backed legal gate

**Files:**
- Modify: `src/app/sign-up/[[...sign-up]]/page.tsx` (full replacement)

**Interfaces:**
- Consumes: `AuthShell` (Task 2), `SignUp` from `@clerk/nextjs`, `buttonVariants` from `src/components/ui/Button.tsx`.

- [ ] **Step 1: Replace the file content**

Replace the full content of `src/app/sign-up/[[...sign-up]]/page.tsx` with:

```tsx
"use client"

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { SignUp } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { AuthShell } from '@/components/auth/AuthShell'
import { buttonVariants } from '@/components/ui/Button'

const LEGAL_ACCEPTED_KEY = 'joben_legal_accepted'

function sanitizeReturnBackUrl(value: string | null): string {
  if (!value) return '/dashboard'
  const trimmed = value.trim()
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//')) return '/dashboard'
  return trimmed
}

function SignUpContent() {
  const searchParams = useSearchParams()
  const returnBackUrl = sanitizeReturnBackUrl(searchParams.get('redirect_url'))
  const [accepted, setAccepted] = useState(false)
  const [checkedStorage, setCheckedStorage] = useState(false)
  const [showError, setShowError] = useState(false)

  useEffect(() => {
    if (window.sessionStorage.getItem(LEGAL_ACCEPTED_KEY) === '1') {
      setAccepted(true)
    }
    setCheckedStorage(true)
  }, [])

  if (!checkedStorage) {
    return null
  }

  if (!accepted) {
    return (
      <AuthShell eyebrow="Sign up" heading="Create your account" subheading="Before continuing, please review and accept our legal terms.">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            const checkbox = event.currentTarget.elements.namedItem('accept_legal') as HTMLInputElement
            if (!checkbox.checked) {
              setShowError(true)
              return
            }
            window.sessionStorage.setItem(LEGAL_ACCEPTED_KEY, '1')
            setAccepted(true)
          }}
          className="space-y-4"
        >
          <label className="flex items-start gap-3 rounded-xl border border-(--border) bg-(--surface) p-4 text-sm text-(--foreground)">
            <input
              type="checkbox"
              name="accept_legal"
              className="mt-0.5 h-4 w-4 rounded border-(--border) bg-(--surface-elevated) text-(--accent)"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:text-(--accent-strong)">
                Terms and Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="text-(--accent) hover:text-(--accent-strong)">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {showError ? (
            <p className="text-sm text-red-400">You must accept the terms and privacy policy to continue.</p>
          ) : null}

          <button type="submit" className={`w-full ${buttonVariants('primary', 'md')}`}>
            Continue to Sign Up
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell eyebrow="Sign up" heading="Continue to Joben" subheading="Create your account to get started.">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl={returnBackUrl} />
    </AuthShell>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={null}>
      <SignUpContent />
    </Suspense>
  )
}
```

Implementer notes:
- This replaces the OLD server-component page (legal-gate form posting to a `'use server'` action, then calling `auth().redirectToSignUp()` to the hosted portal) with a client component that gates `<SignUp/>` behind a `sessionStorage` flag instead of a page redirect.
- **Why `sessionStorage` instead of component state:** Clerk's `<SignUp routing="path" path="/sign-up">` handles its own internal steps (e.g. email verification) by navigating within the `/sign-up/*` path tree. If acceptance were tracked only in local React state, a Clerk-driven internal navigation would remount this page component and reset `accepted` back to `false`, incorrectly re-showing the legal gate mid-signup. `sessionStorage` persists across that remount for the duration of the browser tab/session, matching the old flow's actual behavior (accept once, don't re-ask again this session).
- `checkedStorage` exists purely to avoid a one-frame flash of the legal gate before the `useEffect` has had a chance to read `sessionStorage` on mount — returning `null` for that first frame is intentional, not a bug.
- The checkbox's `required` attribute from the old version is intentionally replaced with manual `checkbox.checked` validation + `showError` state, since the form no longer submits via a real HTML form POST (no server action) — this preserves the same user-facing behavior (can't proceed without checking the box, error message shown if they try).

- [ ] **Step 2: Verify the full file compiles clean**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 3: Commit**

```bash
git add "src/app/sign-up/[[...sign-up]]/page.tsx"
git commit -m "feat(auth): render SignUp inline behind a sessionStorage-backed legal gate"
```

---

### Task 6: Functional and visual verification

**Files:** none (verification only)

This task needs BOTH functional correctness checks (the legal gate actually gates, the embedded forms actually render Clerk's real widget) and visual comparison — auth is not purely decorative, so don't skip straight to screenshots without exercising the flow.

- [ ] **Step 1: Restart the dev server**

The env vars from Task 1 require a fresh server boot to take effect. Stop any running `npm run dev` process and start a new one. Confirm no new startup errors.

- [ ] **Step 2: Test the sign-in page**

Navigate to `http://localhost:3000/sign-in` with Playwright. Confirm:
- The URL stays on `localhost:3000/sign-in` (does NOT redirect to `*.accounts.dev` — this is the core architecture change, verify it actually took effect).
- The page shows the `AuthShell` chrome (Joben logo, "Sign in" eyebrow, "Continue to Joben" heading) with Clerk's actual sign-in widget (OAuth buttons for Google/Microsoft, email field, continue button) rendered inside the same card, styled in the dark token palette (not Clerk's default light theme).

- [ ] **Step 3: Test the sign-up legal gate**

Navigate to `http://localhost:3000/sign-up` with Playwright (use a fresh browser context or clear `sessionStorage` first if the same browser session already visited sign-up during Task 2's dev work, so you're testing the gate's un-accepted state). Confirm:
- The legal-terms gate renders first (checkbox + Terms/Privacy links + "Continue to Sign Up" button), not the Clerk sign-up form.
- Attempting to submit without checking the box shows the "You must accept..." error and does NOT reveal the Clerk form.
- Checking the box and submitting reveals the embedded `<SignUp/>` widget (OAuth buttons, email field) styled the same as sign-in.
- Reload the page (simulating Clerk's internal navigation during a multi-step signup) — confirm the `<SignUp/>` form stays visible and the legal gate does NOT reappear (this is the specific bug this plan's `sessionStorage` approach was designed to prevent — actually verify it, don't just trust the code).

- [ ] **Step 4: Compare against the resumax.ai reference**

The reference screenshot from the original design-research session (session scratchpad — the `/auth` page capture: centered card, radial glow, "SIGN IN" eyebrow, "Continue to ResuMax" heading, OAuth buttons, Terms/Privacy footnote, back-to-home link) is the visual target. Report to the user whether the new Joben auth pages match that composition.

- [ ] **Step 5: Report to user**

Summarize: does the architecture change actually work end-to-end (no hosted-portal redirect, legal gate genuinely gates, gate survives simulated re-navigation)? Show screenshots of both pages. Remind the user that `NEXT_PUBLIC_CLERK_SIGN_IN_URL`/`NEXT_PUBLIC_CLERK_SIGN_UP_URL` must be added to their production environment (Vercel/VPS) before this ships, since this plan only added them to local `.env.local`.
