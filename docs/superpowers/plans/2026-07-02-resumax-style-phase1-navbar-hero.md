# ResuMax-Style Redesign — Phase 1a: Navbar + Hero — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the Navbar and the landing page Hero section to match resumax.ai's visual pattern (word-rotate headline, ambient data-texture background, pill nav/CTA) using the Phase 0 tokens/primitives, with Joben's own copy and content — no other landing sections touched yet.

**Architecture:** Two new small client components (`HeroWordRotate`, `AmbientDataTexture`) under `src/components/landing/`, consumed by `src/app/page.tsx`'s existing hero section. `src/components/ui/Navbar.tsx` is restyled in place — same auth logic, same links, only classes change. `src/lib/content.ts`'s `heroContent.heading` changes shape from a single string to `{ prefix, rotatingWords, suffix }` so the rotating word can be a real animated component instead of a `dangerouslySetInnerHTML` string replace.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4, `framer-motion` (already a dependency), the Phase 0 design tokens (`docs/superpowers/plans/2026-07-01-resumax-style-phase0-design-tokens.md`) and primitives (`Button`/`buttonVariants` from `src/components/ui/Button.tsx`).

## Global Constraints

- Content is 100% Joben. The rotating word content (`Recruiter` / `Hiring Manager` / `Bot`) and the ambient-texture snippets are Joben-flavored, not copied from resumax.
- No new npm dependencies.
- Use the Phase 0 CSS custom properties (`--background`, `--foreground`, `--muted`, `--accent`, `--accent-strong`, `--border`) via Tailwind arbitrary-value syntax (e.g. `bg-(--accent)`) instead of hardcoded hex — this phase's whole point is eliminating the hardcoded-hex pattern in these two files.
- Do not touch the stat-cards grid, the ATS-preview section, pricing, FAQ, or footer in `src/app/page.tsx` — those are separate, later sub-phases. Only the `<section id="builder">` hero block (roughly lines 64-93 of the current file) and the Navbar.
- After every task: `npx tsc --noEmit` must pass with no new errors.
- The decorative ambient-texture snippets must be `aria-hidden="true"` and `pointer-events-none` — they are not real content or real product data, purely visual texture.

---

### Task 1: Restructure `heroContent.heading` for the rotating word

**Files:**
- Modify: `src/lib/content.ts:7-16`

**Interfaces:**
- Produces: `heroContent.heading` is now `{ prefix: string; rotatingWords: string[]; suffix: string }` instead of a plain string. `heroContent.subheading`, `.cta`, `.features` are unchanged. Task 5 consumes this new shape.

- [ ] **Step 1: Replace the `heroContent` export**

Replace the current `heroContent` block in `src/lib/content.ts` (lines 7-16):

```ts
export const heroContent = {
  heading: "Your Resume Is Getting Rejected Before a Human Ever Reads It.",
  subheading: "Many applications are filtered out automatically by ATS software, not because you lack experience, but because your resume is not formatted for machines. Joben scores your resume 0-100, rewrites weak bullet points with AI, and tells you exactly what to fix before your next application.",
  cta: "Check My ATS Score. It's Free",
  features: [
    { text: "No credit card required", icon: "CheckCircle2" },
    { text: "Free forever", icon: "CheckCircle2" },
    { text: "Setup in 2 minutes", icon: "CheckCircle2" },
  ],
};
```

with:

```ts
export const heroContent = {
  heading: {
    prefix: "Your Resume Is Getting Rejected Before a ",
    rotatingWords: ["Recruiter", "Hiring Manager", "Bot"],
    suffix: " Ever Reads It.",
  },
  subheading: "Many applications are filtered out automatically by ATS software, not because you lack experience, but because your resume is not formatted for machines. Joben scores your resume 0-100, rewrites weak bullet points with AI, and tells you exactly what to fix before your next application.",
  cta: "Check My ATS Score. It's Free",
  features: [
    { text: "No credit card required", icon: "CheckCircle2" },
    { text: "Free forever", icon: "CheckCircle2" },
    { text: "Setup in 2 minutes", icon: "CheckCircle2" },
  ],
};
```

- [ ] **Step 2: Verify no other file breaks**

Run: `grep -rn "heroContent" src --include="*.tsx" --include="*.ts"`
Expected: two files only — `src/lib/content.ts` (the definition) and `src/app/page.tsx` (the only consumer; it will be broken by this change until Task 5 updates it — that's expected and gets fixed in Task 5, not this task).

Run: `npx tsc --noEmit`
Expected: type errors in `src/app/page.tsx` only (because it still does `heroContent.heading.replace(...)`, which no longer type-checks against an object). This is expected — `page.tsx` is out of scope for this task and gets fixed in Task 5. Confirm the errors are limited to `src/app/page.tsx` and there are no errors in any other file.

- [ ] **Step 3: Commit**

```bash
git add src/lib/content.ts
git commit -m "feat(content): restructure hero heading for animated rotating word"
```

---

### Task 2: Create the `HeroWordRotate` component

**Files:**
- Create: `src/components/landing/HeroWordRotate.tsx`

**Interfaces:**
- Consumes: `framer-motion` (`AnimatePresence`, `motion`), `--accent` CSS variable.
- Produces: `export function HeroWordRotate({ words, intervalMs }: HeroWordRotateProps)`. `HeroWordRotateProps = { words: string[]; intervalMs?: number }`. Renders one word at a time, cycling through `words` on a timer, accent-colored, with a slide/fade transition. Task 5 consumes this as `<HeroWordRotate words={heroContent.heading.rotatingWords} />` inline inside the `<h1>`.

- [ ] **Step 1: Write the component**

Create `src/components/landing/HeroWordRotate.tsx`:

```tsx
"use client"

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export interface HeroWordRotateProps {
  words: string[]
  intervalMs?: number
}

export function HeroWordRotate({ words, intervalMs = 2400 }: HeroWordRotateProps) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % words.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [words.length, intervalMs])

  return (
    <span className="relative inline-block align-baseline text-(--accent)">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-block"
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
```

Note for the implementer: this is a deliberately simpler technique than resumax's own DOM-measurement approach (they render an invisible duplicate to pre-measure width before animating). This version lets the line reflow slightly as word lengths change, which is an accepted tradeoff — do not add width-measurement logic, that would be scope creep for this task.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no NEW errors from this file (the pre-existing `page.tsx` errors from Task 1 are still expected at this point, unrelated to this task).

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/HeroWordRotate.tsx
git commit -m "feat(landing): add HeroWordRotate animated word-cycle component"
```

---

### Task 3: Create the `AmbientDataTexture` component

**Files:**
- Create: `src/components/landing/AmbientDataTexture.tsx`

**Interfaces:**
- Consumes: `font-mono` utility (Phase 0 Task 3), `--foreground` CSS variable.
- Produces: `export function AmbientDataTexture()` — a non-interactive, absolutely-positioned field of low-opacity monospace text snippets meant to sit behind the hero content as ambient visual texture. Task 5 consumes this as `<AmbientDataTexture />`, positioned as a sibling of the hero's existing glow-blob background div.

- [ ] **Step 1: Write the component**

Create `src/components/landing/AmbientDataTexture.tsx`:

```tsx
const SNIPPETS: { text: string; top: string; left: string }[] = [
  { text: 'ATS score 54 → 87', top: '8%', left: '4%' },
  { text: 'Bullet rewritten', top: '18%', left: '78%' },
  { text: 'Keyword matched: kubernetes', top: '30%', left: '2%' },
  { text: 'Cover letter generated', top: '6%', left: '62%' },
  { text: 'Resume tailored to JD', top: '44%', left: '85%' },
  { text: 'v2 → v3', top: '58%', left: '6%' },
  { text: '3 keywords added', top: '70%', left: '70%' },
  { text: 'Score +12', top: '80%', left: '10%' },
  { text: 'PDF exported', top: '12%', left: '40%' },
  { text: 'Content quality 20/40', top: '66%', left: '38%' },
  { text: 'Auto-fix applied', top: '86%', left: '55%' },
  { text: 'Recruiter-ready', top: '38%', left: '50%' },
]

export function AmbientDataTexture() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      {SNIPPETS.map((snippet) => (
        <span
          key={snippet.text}
          className="absolute whitespace-nowrap font-mono text-[11px] text-(--foreground)/[0.06]"
          style={{ top: snippet.top, left: snippet.left }}
        >
          {snippet.text}
        </span>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no NEW errors from this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/landing/AmbientDataTexture.tsx
git commit -m "feat(landing): add AmbientDataTexture decorative background component"
```

---

### Task 4: Restyle `Navbar.tsx`

**Files:**
- Modify: `src/components/ui/Navbar.tsx`

**Interfaces:**
- Consumes: `buttonVariants` from `src/components/ui/Button.tsx` (Phase 0), `--background`/`--border`/`--foreground`/`--muted` CSS variables.

- [ ] **Step 1: Replace the file content**

Replace the full content of `src/components/ui/Navbar.tsx` with:

```tsx
"use client"

import Image from 'next/image'
import Link from 'next/link'
import { useAuth, UserButton } from '@clerk/nextjs'
import { Plus } from 'lucide-react'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { motion } from 'framer-motion'
import { buttonVariants } from '@/components/ui/Button'

export function Navbar() {
  const { isLoaded, isSignedIn } = useAuth()

  const publicLinks = [
    { href: '/#builder', label: 'AI Resume Builder' },
    { href: '/#analysis', label: 'ATS Analysis' },
    { href: '/#pricing', label: 'Pricing' },
    { href: '/#faq', label: 'FAQ' },
  ]

  const appLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/resumes', label: 'Resumes' },
    { href: '/cover-letters', label: 'Cover Letters' },
    { href: '/ai-review', label: 'AI Review' },
  ]

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-(--border) bg-(--background)/90 backdrop-blur-md">
      <section className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <section className="flex items-center space-x-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="relative h-8 w-8 overflow-hidden rounded-lg">
              <Image
                src="/jobeneu_logo.jpg"
                alt="Joben logo"
                fill
                sizes="32px"
                className="object-cover"
                priority
              />
            </span>
            <span className="text-2xl font-bold tracking-tight text-(--foreground)">Joben</span>
          </Link>

          <section className="hidden items-center space-x-1 md:flex">
            {(isLoaded && isSignedIn ? appLinks : publicLinks).map((link) => (
              <motion.div
                key={link.href}
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-(--muted) transition-colors hover:text-(--foreground)"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
          </section>
        </section>

        <section className="flex items-center space-x-3">
          {isLoaded && !isSignedIn && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link href="/sign-in" className="text-sm font-medium text-(--muted) hover:text-(--foreground)">
                  Log in
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <AuthAwareSignupLink className={buttonVariants('primary', 'sm')}>
                  Get Started Free
                </AuthAwareSignupLink>
              </motion.div>
            </>
          )}

          {isLoaded && isSignedIn && (
            <>
              <motion.div
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
              >
                <Link
                  href="/resumes/new"
                  className={`hidden sm:flex items-center gap-1.5 ${buttonVariants('primary', 'sm')}`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New</span>
                </Link>
              </motion.div>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: 'h-9 w-9 border border-(--border)'
                  }
                }}
              />
            </>
          )}
        </section>
      </section>
    </nav>
  )
}
```

The only substantive differences from the current file: hardcoded hex classes (`bg-[#020202]/90`, `border-white/10`, `text-[#FFFFFF]/75`, the `from-[#0A9548] to-[#04471C]` gradient buttons, `shadow-[#0A9548]/25`) are replaced with token-based classes and `buttonVariants('primary', 'sm')` for both CTA buttons. All auth logic (`useAuth`, conditional rendering, `AuthAwareSignupLink`, `UserButton`), link arrays, and motion wrappers are unchanged.

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: the `page.tsx` errors from Task 1 are still the only pre-existing ones; no new errors from `Navbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Navbar.tsx
git commit -m "feat(design): restyle Navbar with resumax-derived tokens and Button primitive"
```

---

### Task 5: Restyle the Hero section and add an `lg` Button size

**Files:**
- Modify: `src/components/ui/Button.tsx` (add an `lg` size)
- Modify: `src/app/page.tsx:1-94` (hero section only)

**Interfaces:**
- Consumes: `HeroWordRotate` (Task 2), `AmbientDataTexture` (Task 3), `heroContent.heading.{prefix,rotatingWords,suffix}` (Task 1), `buttonVariants` (Phase 0, extended by this task's Step 1).

- [ ] **Step 1: Add an `lg` size to the Button primitive**

The hero's primary CTA needs a larger pill than the Navbar's `sm`/`md` sizes provide. In `src/components/ui/Button.tsx`, change:

```ts
export type ButtonSize = 'sm' | 'md'
```

to:

```ts
export type ButtonSize = 'sm' | 'md' | 'lg'
```

And change the `SIZE_CLASSES` object from:

```ts
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
}
```

to:

```ts
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
  lg: 'px-8 py-4 text-lg gap-2',
}
```

Nothing else in `Button.tsx` changes — `buttonVariants` and `Button` already read from `SIZE_CLASSES` generically via the `size` parameter, so the new size is automatically available to both.

- [ ] **Step 2: Update imports at the top of `src/app/page.tsx`**

Add two new imports (component imports, alongside the existing ones):

```tsx
import { HeroWordRotate } from '@/components/landing/HeroWordRotate'
import { AmbientDataTexture } from '@/components/landing/AmbientDataTexture'
import { buttonVariants } from '@/components/ui/Button'
```

- [ ] **Step 3: Replace the hero section markup**

Replace `src/app/page.tsx` lines 64-93 (the full `<section id="builder">...</section>` opening through the closing of the features-checklist `</div>`, i.e. everything up to but NOT including the `{/* STAT CARDS */}` comment) with:

```tsx
        <section id="builder" className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center mt-12 mb-20" suppressHydrationWarning>
          <div className="absolute inset-0 -z-10 flex items-center justify-center" suppressHydrationWarning>
            <div className="w-150 h-150 bg-(--accent)/6 rounded-full blur-[100px] pointer-events-none" suppressHydrationWarning></div>
            <div className="w-100 h-100 bg-(--accent-strong)/8 rounded-full blur-[100px] pointer-events-none -ml-32" suppressHydrationWarning></div>
          </div>
          <AmbientDataTexture />

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-(--foreground) max-w-4xl mx-auto leading-tight">
            {heroContent.heading.prefix}
            <HeroWordRotate words={heroContent.heading.rotatingWords} />
            {heroContent.heading.suffix}
          </h1>

          <p className="text-xl text-(--muted) mb-10 max-w-2xl mx-auto">
            {heroContent.subheading}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12" suppressHydrationWarning>
            <AuthAwareSignupLink className={`${buttonVariants('primary', 'lg')} shadow-lg shadow-(--accent)/30`}>
              {heroContent.cta} <ChevronRight className="w-5 h-5" />
            </AuthAwareSignupLink>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-(--muted)" suppressHydrationWarning>
            {heroContent.features.map((feature, index) => {
              const Icon = icons[feature.icon];
              return (
                <span key={index} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-(--accent)" /> {feature.text}
                </span>
              );
            })}
          </div>

```

Everything from `{/* STAT CARDS */}` onward (the stat-cards grid, its closing `</section>`, and everything after) stays exactly as it is today — do not touch it.

- [ ] **Step 4: Verify the full file compiles clean**

Run: `npx tsc --noEmit`
Expected: clean, no output. This is the task that resolves the `page.tsx` type errors that Tasks 1-4 left in place (this is the first task that actually updates `page.tsx` to match the new `heroContent.heading` shape) — if there are still errors, they are real regressions, not expected ones.

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/app/page.tsx
git commit -m "feat(design): restyle Hero with word-rotate headline and ambient data texture"
```

---

### Task 6: Visual verification against the resumax.ai reference

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server** (if not already running)

Run: `npm run dev` (background). A `.env.local` with Clerk dev-instance keys and either real or placeholder Supabase values is required for the server to boot — confirm it's already in place before starting (it should be, from earlier in this session).

- [ ] **Step 2: Screenshot the Joben homepage hero**

Use Playwright to navigate to `http://localhost:3000`, wait for the hero to render (including at least one word-rotate cycle, ~2.5s), and take a viewport screenshot.

- [ ] **Step 3: Compare against the resumax.ai reference**

The reference screenshots from the original design-research session are at (session scratchpad, already captured): the resumax hero viewport screenshot showing the word-rotate headline, ambient background texture, and pill nav/CTA. Place the Joben screenshot and the resumax reference side by side (or sequentially) and report to the user:
- Does the Navbar match the pattern (logo left, links center, pill CTA right, blurred background)?
- Does the Hero headline show the tight tracking, bold weight, and the word-rotate cycling through Recruiter/Hiring Manager/Bot?
- Is the ambient data-texture field visible as a faint background layer, not distracting from the readable content?
- Is the CTA a pill button in the Joben accent green (not the old gradient)?

- [ ] **Step 4: Report to user**

Show both screenshots and the comparison notes. Do not proceed to the next landing-page sub-section (stat cards / resume-score showcase) until the user confirms this one.
