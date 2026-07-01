# ResuMax-Style Redesign — Phase 0: Design Tokens & Primitives — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the new resumax-derived design tokens (colors, fonts) and three reusable UI primitives (Button, Card, Badge) that Phase 1–4 page work will consume, without touching any existing page layout yet.

**Architecture:** Update the existing CSS-custom-property token layer in `src/app/globals.css` in place (same names where possible, new tokens added alongside). Add one new font (`JetBrains Mono`) via `next/font/google`, registered as Tailwind's `--font-mono` theme key so `font-mono` works as a utility class app-wide. Create three new hand-rolled (no new dependency) primitive components under `src/components/ui/` that consume the token CSS variables instead of hardcoded hex, matching the codebase's existing hand-rolled-Tailwind convention (no shadcn CLI scaffolding exists in this repo despite CLAUDE.md's aspirational "shadcn/ui" mention — confirmed by inspecting `src/components/ui/*.tsx`, which are all plain Tailwind, and the absence of `components.json`). Prove the primitives work by migrating the one already-known off-brand spot (`AlertModal`'s hardcoded `bg-blue-500` button and `bg-[#111]` panel) to consume them.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4 (CSS-first `@theme`/CSS-custom-property config, no `tailwind.config.ts` file), `next/font/google`, no new npm dependencies.

## Global Constraints

- Content is 100% Joben — this phase touches no copy at all (tokens/components only).
- No new npm dependencies (no `class-variance-authority`/`clsx`/`tailwind-merge` — the variant surface is small enough for a plain lookup object).
- Neutral color scale and accent-hue swap exactly as approved in the design spec (`docs/superpowers/specs/2026-07-01-resumax-style-redesign-design.md`, §1.2) — do not invent new colors.
- `framer-motion` is already a dependency — do not add animation libraries in this phase (no animated component exists yet).
- Do not add `Instrument Serif` in this phase — its only approved use (testimonial pull-quotes) is deferred per the spec; adding an unused font is dead weight. Revisit when the testimonial section is scheduled.
- Do not touch `src/app/page.tsx`, `src/components/ui/Navbar.tsx`, or any other page-level file except `src/components/ui/AlertModal.tsx` (the one proof-of-life migration in Task 7).
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Replace color tokens in `globals.css`

**Files:**
- Modify: `src/app/globals.css:1-20`

**Interfaces:**
- Produces: CSS custom properties `--brand-black`, `--brand-deep`, `--brand-mid`, `--brand-accent`, `--brand-accent-bright`, `--brand-accent-muted`, `--brand-white`, `--brand-text-faint`, `--background`, `--surface`, `--surface-strong`, `--surface-elevated`, `--foreground`, `--muted`, `--muted-2`, `--border`, `--accent`, `--accent-strong`, `--accent-muted` — all later tasks/pages style against these names (unchanged names where they already existed, so nothing else breaks).

- [ ] **Step 1: Replace the `:root` block**

Replace `src/app/globals.css` lines 1–20 (the `@import` line through the closing `}` of `:root`) with:

```css
@import "tailwindcss";

:root {
  --brand-black: #0a0a0e;
  --brand-deep: #12121a;
  --brand-mid: #1a1a24;
  --brand-accent: #2cb87a;
  --brand-accent-bright: #4fd69b;
  --brand-accent-muted: #2cb87a1f;
  --brand-white: #f5f1eb;
  --brand-text-faint: #5e5e66;

  --background: var(--brand-black);
  --surface: var(--brand-deep);
  --surface-strong: var(--brand-mid);
  --surface-elevated: var(--brand-mid);
  --foreground: var(--brand-white);
  --muted: color-mix(in srgb, var(--brand-white) 54%, transparent);
  --muted-2: var(--brand-text-faint);
  --border: color-mix(in srgb, var(--brand-white) 8%, transparent);
  --accent: var(--brand-accent);
  --accent-strong: var(--brand-accent-bright);
  --accent-muted: var(--brand-accent-muted);
}
```

Notes on the mapping (so the reviewer can check the reasoning, not just the diff):
- `--muted` (secondary text) moves from a 72%-opacity white to 54%, matching resumax's `#8A8A92` on their `#0A0A0E` background (measured contrast ratio, not a guess — `#8A8A92` over `#0A0A0E` is ~54% perceived white).
- `--muted-2` now points at the new `--brand-text-faint` (`#5E5E66`, resumax's tertiary text) instead of a 58%-opacity white — a distinct third text tier, matching resumax's 3-tier text system (foreground / muted / faint) instead of Joben's previous 2-tier one.
- `--surface-elevated` is new — resumax uses two surface steps (`card` and a lighter `popover`/elevated step); Joben's `--surface-strong` already matches the elevated value (`#1A1A24`), so `--surface-elevated` is an alias of it for callers that want the semantically-elevated name.
- `--accent-muted` is new — the 12%-alpha accent fill resumax uses for keyword-highlight pills and subtle badge backgrounds (Phase 1+ will consume this; nothing does yet).

- [ ] **Step 2: Verify the file parses and the app still builds**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0) — CSS changes don't affect TypeScript, this just confirms Step 1's edit didn't corrupt anything else in the file via a bad copy/paste (the file is `.css`, so also open it and confirm by eye that only lines 1–20 changed and line 21 onward — `body { background-color: var(--background); ...`) is untouched).

Run: `grep -c "brand-accent-muted" src/app/globals.css`
Expected: `2` (one definition, one reference inside `--accent-muted`)

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(design): swap color tokens to resumax-derived palette with Joben green accent"
```

---

### Task 2: Switch body font from Inter to the native system-sans stack

**Files:**
- Modify: `src/app/layout.tsx:1-13` (imports + `inter` const)
- Modify: `src/app/layout.tsx:113` (body `className`)

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: body no longer carries an `inter.*` class; Tailwind's default `font-sans` (the `ui-sans-serif, system-ui, ...` stack) becomes the inherited body font, matching resumax's un-overridden `font-sans`.

- [ ] **Step 1: Remove the Inter import and instantiation**

In `src/app/layout.tsx`, delete this line (currently line 4):

```ts
import { Inter } from 'next/font/google'
```

And delete this line (currently line 11):

```ts
const inter = Inter({ subsets: ['latin'] })
```

- [ ] **Step 2: Update the body className**

Find (currently line 113):

```tsx
<body className={`${inter.className} bg-(--background) text-(--foreground) min-h-screen flex flex-col`} suppressHydrationWarning>
```

Replace with:

```tsx
<body className="bg-(--background) text-(--foreground) min-h-screen flex flex-col font-sans" suppressHydrationWarning>
```

(`font-sans` is a default Tailwind v4 utility — it needs no theme registration, it already resolves to `ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`, which is byte-for-byte the stack resumax uses.)

- [ ] **Step 3: Verify no other file imports the removed `inter` binding**

Run: `grep -rn "from '@/app/layout'" src --include="*.tsx" --include="*.ts"`
Expected: no matches (nothing imports the `inter` const from outside `layout.tsx`, so removing it is safe)

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat(design): drop Inter, use native system-sans stack to match resumax typography"
```

---

### Task 3: Add JetBrains Mono and register it as the `font-mono` utility

**Files:**
- Modify: `src/app/layout.tsx` (add import + instantiation + body className)
- Modify: `src/app/globals.css` (register the CSS variable as a Tailwind theme key)

**Interfaces:**
- Produces: the `font-mono` Tailwind utility now renders JetBrains Mono instead of the browser default monospace font. Phase 1 eyebrow labels ("· PRICING", "01/05"), FAQ "OPEN"/"CLOSE" labels, and any data-style UI text will use `font-mono`.

- [ ] **Step 1: Add the font import and instantiation in `layout.tsx`**

Add this import near the top of `src/app/layout.tsx` (next to the other top-level imports):

```ts
import { JetBrains_Mono } from 'next/font/google'
```

Add this instantiation next to where `inter` used to be (same spot, now empty after Task 2):

```ts
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains-mono' })
```

- [ ] **Step 2: Apply the font variable class to `<body>`**

Update the body className from Task 2's result:

```tsx
<body className={`${jetbrainsMono.variable} bg-(--background) text-(--foreground) min-h-screen flex flex-col font-sans`} suppressHydrationWarning>
```

(`next/font`'s `variable` option outputs a class that only *defines* the `--font-jetbrains-mono` custom property on the element — it doesn't apply the font anywhere by itself. That's why `font-sans` still governs the base body text; only elements that opt into `font-mono` pick up JetBrains Mono.)

- [ ] **Step 3: Register the theme key in `globals.css`**

Add this block to `src/app/globals.css`, directly after the `:root { ... }` block from Task 1 (before the `body { ... }` rule):

```css
@theme inline {
  --font-mono: var(--font-jetbrains-mono), ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
}
```

(Tailwind v4's `@theme inline` block maps a CSS variable to a theme key; setting `--font-mono` here is what makes the `font-mono` utility class resolve to JetBrains Mono app-wide, with a system-monospace fallback chain if the font hasn't loaded yet.)

- [ ] **Step 4: Verify the font variable and utility are wired correctly**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `grep -n "font-jetbrains-mono" src/app/layout.tsx src/app/globals.css`
Expected: two matches — one in `layout.tsx` (the `variable:` option) and one in `globals.css` (the `@theme inline` block)

- [ ] **Step 5: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css
git commit -m "feat(design): load JetBrains Mono and register it as the font-mono utility"
```

---

### Task 4: Create the `Button` primitive

**Files:**
- Create: `src/components/ui/Button.tsx`

**Interfaces:**
- Consumes: `--accent`, `--accent-strong`, `--accent-muted`, `--background`, `--foreground`, `--border` CSS variables from Task 1.
- Produces: `export function Button(props: ButtonProps)` and `export function buttonVariants(variant?: ButtonVariant, size?: ButtonSize): string` — `buttonVariants` is exported separately so `<Link>`-based CTAs (Phase 1's Navbar, hero, pricing) can apply the identical classes without being a `<button>` element. `ButtonVariant = 'primary' | 'secondary' | 'ghost'`, `ButtonSize = 'sm' | 'md'`.

- [ ] **Step 1: Write the component**

Create `src/components/ui/Button.tsx`:

```tsx
import * as React from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost'
export type ButtonSize = 'sm' | 'md'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-(--accent) text-(--background) hover:bg-(--accent-strong)',
  secondary:
    'bg-transparent text-(--foreground) border border-(--border) hover:border-(--accent)',
  ghost:
    'bg-transparent text-(--foreground)/75 hover:text-(--foreground)',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[13px] gap-1.5',
  md: 'px-6 py-3 text-sm gap-2',
}

export function buttonVariants(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center rounded-full font-medium transition-colors ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]}`
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`${buttonVariants(variant, size)} ${className}`.trim()}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify it compiles and exports the expected names**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `grep -n "export function Button\|export function buttonVariants" src/components/ui/Button.tsx`
Expected: both lines present

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat(design): add Button primitive with pill/accent styling"
```

---

### Task 5: Create the `Card` primitive

**Files:**
- Create: `src/components/ui/Card.tsx`

**Interfaces:**
- Consumes: `--surface`, `--surface-elevated`, `--border` CSS variables from Task 1.
- Produces: `export function Card(props: CardProps)`. `CardProps = React.HTMLAttributes<HTMLDivElement> & { elevated?: boolean }`.

- [ ] **Step 1: Write the component**

Create `src/components/ui/Card.tsx`:

```tsx
import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export function Card({ elevated = false, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-(--border) ${elevated ? 'bg-(--surface-elevated)' : 'bg-(--surface)'} ${className}`.trim()}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Card.tsx
git commit -m "feat(design): add Card primitive with flat surface/border styling"
```

---

### Task 6: Create the `Badge` and `Eyebrow` primitives

**Files:**
- Create: `src/components/ui/Badge.tsx`

**Interfaces:**
- Consumes: `--accent`, `--accent-muted`, `--background` CSS variables from Task 1, `font-mono` utility from Task 3.
- Produces: `export function Badge(props: BadgeProps)` (`BadgeVariant = 'solid' | 'muted'`) and `export function Eyebrow(props: EyebrowProps)` (`EyebrowProps = { children: React.ReactNode; className?: string }`) — the small mono uppercase "· LABEL" pattern used above section headings ("· PRICING") and step counters ("01 / 05").

- [ ] **Step 1: Write the components**

Create `src/components/ui/Badge.tsx`:

```tsx
import * as React from 'react'

export type BadgeVariant = 'solid' | 'muted'

const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  solid: 'bg-(--accent) text-(--background)',
  muted: 'bg-(--accent-muted) text-(--accent)',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'solid', className = '', ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide ${BADGE_VARIANT_CLASSES[variant]} ${className}`.trim()}
      {...props}
    />
  )
}

export interface EyebrowProps {
  children: React.ReactNode
  className?: string
}

export function Eyebrow({ children, className = '' }: EyebrowProps) {
  return (
    <span className={`inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wide text-(--accent) ${className}`.trim()}>
      <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Badge.tsx
git commit -m "feat(design): add Badge and Eyebrow primitives"
```

---

### Task 7: Migrate `AlertModal` to the new primitives (proof of life)

**Files:**
- Modify: `src/components/ui/AlertModal.tsx`

**Interfaces:**
- Consumes: `Button` from Task 4 (`import { Button } from '@/components/ui/Button'`), `Card` from Task 5 (`import { Card } from '@/components/ui/Card'`).

This is the one existing file this phase touches, chosen because it has a pre-existing, already-known design-system violation (hardcoded `bg-blue-500` button and `bg-[#111]`/`rounded-2xl` panel that don't match any token) — fixing it is both a genuine bug fix and the most honest way to prove the new primitives render correctly in a real, already-shipped component instead of an inert demo.

- [ ] **Step 1: Replace the panel and button markup**

In `src/components/ui/AlertModal.tsx`, replace the full return block (currently lines 32–52):

```tsx
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={ref} className="bg-[#111] border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium text-white mt-4">Important Notice</h3>
          <p className="text-white/80 mt-2 mb-4 text-sm">
            {title || "Please note that only PDF and DOCX files are supported for import. Scanned documents or images in PDF format will not be imported correctly."}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onConfirm}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              I Understand
            </button>
          </div>
        </div>
      </div>
    </div>
  )
```

with:

```tsx
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card ref={ref} elevated className="p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h3 className="text-lg font-medium text-(--foreground) mt-4">Important Notice</h3>
          <p className="text-(--muted) mt-2 mb-4 text-sm">
            {title || "Please note that only PDF and DOCX files are supported for import. Scanned documents or images in PDF format will not be imported correctly."}
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={onConfirm}>I Understand</Button>
          </div>
        </div>
      </Card>
    </div>
  )
```

Add the two new imports at the top of the file (after the existing `import { AlertTriangle } from 'lucide-react'` line):

```tsx
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
```

- [ ] **Step 2: Forward the ref through `Card`**

`Card` (Task 5) renders a plain `<div {...props} />` without `React.forwardRef`, so passing `ref={ref}` from Step 1 will fail type-checking. Update `src/components/ui/Card.tsx` to forward the ref:

```tsx
import * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { elevated = false, className = '', ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-(--border) ${elevated ? 'bg-(--surface-elevated)' : 'bg-(--surface)'} ${className}`.trim()}
      {...props}
    />
  )
})
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/AlertModal.tsx src/components/ui/Card.tsx
git commit -m "fix(design): migrate AlertModal off hardcoded colors onto Button/Card primitives"
```

---

### Task 8: Visual smoke test

**Files:** none (verification only)

Per the design spec, full resumax-vs-Joben visual comparisons start in Phase 1, once these tokens/primitives have real page sections to render. Phase 0 has no page consumers yet (Task 7's `AlertModal` is only reachable via an authenticated PDF-import flow, out of scope to wire up just for a screenshot), so this task verifies the *token layer* renders correctly, not a resumax comparison.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background)
Expected: server ready on `http://localhost:3000` with no console errors

- [ ] **Step 2: Screenshot the homepage body background/text**

Use Playwright to navigate to `http://localhost:3000` and take a full-viewport screenshot.
Expected: page background reads as a near-black with a cool tint (not pure `#000`/`#020202`) and body text reads as a warm off-white (not pure `#FFFFFF`) wherever it isn't overridden by a hardcoded hex class — confirms Task 1/2's token and font changes are live. (Buttons/gradients will *not* look different yet — they still use hardcoded hex until Phase 1 migrates each page; that's expected and not a bug.)

- [ ] **Step 3: Run the full verification suite**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `npm run lint`
Expected: no new errors introduced by this phase's files

- [ ] **Step 4: Report to user**

Show the homepage screenshot, note explicitly which visual changes are expected at this stage (background/text tone, nothing else) and which are intentionally deferred to Phase 1 (accent color on buttons/gradients, new component patterns, layout changes) so the user isn't surprised the page doesn't look like resumax yet.

---

## What's next (not part of this plan)

Phases 1–4 (Landing sections, Auth, Dashboard shell, Resume builder) get their own implementation plans once this phase is confirmed, per the design spec's §5 execution order. Phase 1 is planned section-by-section (Navbar → Hero → Resume score → 5-step loop → Pricing → FAQ → Footer), each with its own resumax-vs-Joben Playwright comparison, per the user's mandated workflow.
