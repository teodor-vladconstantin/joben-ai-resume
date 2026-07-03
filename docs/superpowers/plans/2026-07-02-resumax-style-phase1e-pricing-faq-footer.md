# ResuMax-Style Redesign — Phase 1e: Pricing, FAQ, Footer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the landing page's Pricing, FAQ, and Footer sections onto the Phase 0 tokens/primitives, completing Phase 1 (the full landing page). No content, business logic, or Stripe/plan-data changes — visual restyle only, section by section, matching resumax's card/accordion/footer visual language where it fits Joben's actual (simpler) content shape.

**Architecture:** All three sections live in `src/app/page.tsx` and get edited in place — no new components needed (this phase reuses `Card`, `Badge`, `buttonVariants` from `src/components/ui/`, already imported or trivially added). Scope note, decided during planning: resumax's pricing page also has a monthly/annual toggle and a full feature-comparison table — Joben's `pricingPlans` data has no monthly/annual variants (Free is forever, Pro is monthly, the third tier is a flat 6-month plan), so a toggle would not map onto real data and is explicitly OUT of scope; a comparison table is also out of scope (large, separate undertaking, not blocking the core visual restyle). Similarly, resumax's footer has multi-column link lists Joben's `footerContent` doesn't have data for — the footer keeps its current simple single-column structure, just re-themed, plus it now renders the pre-existing but previously-unused `footerContent.creatorCredit` field.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind v4, Phase 0/1 tokens and primitives.

## Global Constraints

- Content is 100% Joben — no text changes to `pricingPlans`, `faqItems`, or `footerContent` in `src/lib/content.ts` (this phase is pure JSX/class restyling, it does not touch `content.ts` at all).
- No new npm dependencies.
- Use Phase 0/1 CSS custom properties via Tailwind arbitrary-value syntax instead of hardcoded hex.
- Each task touches exactly one section of `src/app/page.tsx` (Pricing, FAQ, or Footer) — do not let edits bleed into neighboring sections.
- `<details>`/`<summary>` stays the FAQ accordion mechanism (native, accessible, no-JS-required) — only its visual styling changes, not its interaction model.
- After every task: `npx tsc --noEmit` must pass with no new errors.

---

### Task 1: Restyle the Pricing section

**Files:**
- Modify: `src/app/page.tsx` (the `<section id="pricing">` block only, currently lines 227-265 — re-locate by the `{/* PRICING */}` comment if line numbers have shifted)

**Interfaces:**
- Consumes: `Card`, `Badge` from `src/components/ui/` (add a `Badge` import if not already present — check the top of the file first, since `Card` and `buttonVariants` are already imported from earlier phases).

- [ ] **Step 1: Add the `Badge` import if missing**

Check the top of `src/app/page.tsx` for an existing `import { Badge } from '@/components/ui/Badge'`. If it's not there, add it alongside the other `@/components/ui/*` imports (`Card`, `buttonVariants`).

- [ ] **Step 2: Replace the pricing section**

Replace the `{/* PRICING */}` section (from that comment through its closing `</section>`) with:

```tsx
        {/* PRICING */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-16" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">Simple, Transparent Pricing</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">Start for free, upgrade when you need the competitive edge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto" suppressHydrationWarning>
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                elevated={plan.isBestValue}
                radius="lg"
                className={`p-8 flex flex-col relative ${plan.isBestValue ? 'border-(--accent)' : ''} ${plan.isPrimary ? 'md:-translate-y-4' : ''}`}
                suppressHydrationWarning
              >
                {plan.isBestValue && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    Best Value
                  </Badge>
                )}

                <h3 className="text-xl font-bold text-(--foreground)">{plan.name}</h3>
                <p className="text-(--muted) text-sm mt-2 mb-6">{plan.description}</p>
                <div className="text-4xl font-bold text-(--foreground) mb-6" suppressHydrationWarning>{plan.price}<span className="text-lg text-(--muted) font-normal">{plan.price_period}</span></div>
                <ul className="space-y-4 mb-8 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex gap-3 text-(--foreground)"><CheckCircle2 className="text-(--accent) w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex gap-3 text-(--muted) line-through"><X className="text-red-400 w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                </ul>
                <AuthAwareSignupLink className={`w-full text-center ${buttonVariants(plan.isBestValue || plan.isPrimary ? 'primary' : 'secondary', 'md')}`}>{plan.cta}</AuthAwareSignupLink>
              </Card>
            ))}
          </div>
        </section>
```

Implementer notes:
- `plan.isBestValue` maps to `Badge`'s default `solid` variant (accent pill) — do not pass a `variant` prop, the default is correct here.
- The old inline ternary for background/border/shadow per plan type (`isPrimary`/`isBestValue`/else) is replaced by `Card`'s `elevated` prop (true only for `isBestValue`) plus a conditional `border-(--accent)` class — this is a deliberate simplification, not a missed requirement: `Card` already provides the flat surface/border/radius, so only the two Joben-specific accents (best-value border, primary's vertical offset) need to stay as extra conditional classes.
- The old `bg-linear-to-r from-[#0A9548] to-[#04471C]` gradient buttons and outline button are replaced by `buttonVariants('primary', 'md')` (for `isBestValue`/`isPrimary` plans) or `buttonVariants('secondary', 'md')` (for the plain Free plan) — this matches the Button primitive's existing two-variant vocabulary from Phase 0, no new variant needed.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `grep -c "0A9548\|16DB65\|#020202\|#0A0F0D" src/app/page.tsx`
Expected: a lower count than before this task (some hardcoded hex may remain in sections not yet touched by this plan — this check just confirms the pricing section specifically no longer contributes any; don't worry about hex elsewhere in the file).

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(design): restyle Pricing section with Card/Badge primitives and tokens"
```

---

### Task 2: Restyle the FAQ section

**Files:**
- Modify: `src/app/page.tsx` (the `<section id="faq">` block only, currently lines 267-292 — re-locate by the `{/* FAQ */}` comment)

**Interfaces:** none new — uses only Tailwind token classes and the existing native `<details>`/`<summary>` pattern.

- [ ] **Step 1: Replace the FAQ section**

Replace the `{/* FAQ */}` section (from that comment through its closing `</section>`) with:

```tsx
        {/* FAQ */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">Frequently Asked Questions</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">Everything you need to know before building your next resume.</p>
          </div>

          <div className="mx-auto max-w-4xl" suppressHydrationWarning>
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group border-b border-(--border) first:border-t"
                suppressHydrationWarning
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-(--foreground) [&::-webkit-details-marker]:hidden"
                  suppressHydrationWarning
                >
                  <span>{item.question}</span>
                  <span className="font-mono text-xs uppercase tracking-wide text-(--accent) group-open:hidden">Open</span>
                  <span className="hidden font-mono text-xs uppercase tracking-wide text-(--accent) group-open:inline">Close</span>
                </summary>
                <div className="pb-5 text-(--muted)" suppressHydrationWarning>{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
```

Implementer notes:
- The old design was individually-rounded, individually-bordered cards (`rounded-2xl border ... bg-[#0A0F0D]`) with a rotating "+" icon. The new design matches resumax's border-row list pattern: a single `max-w-4xl` column where each `<details>` is a full-width row separated by `border-b` (bottom border), with `first:border-t` adding a top border only to the very first row (so the whole list reads as one bordered block, not individual boxes).
- The rotating "+" icon is replaced by two mono-uppercase text labels ("Open"/"Close") that toggle visibility via Tailwind's `group-open:` variant (`group-open:hidden` hides "Open" when expanded, `group-open:inline` reveals "Close") — both rely on the parent `<details>` carrying the `group` class, which it already does.
- `<details>`/`<summary>` semantics and behavior are completely unchanged — this is a pure class/markup restyle within the same interaction pattern.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(design): restyle FAQ section as a bordered accordion row list"
```

---

### Task 3: Restyle the Footer

**Files:**
- Modify: `src/app/page.tsx` (the `<footer>` block only, currently lines 295-307)

**Interfaces:** none new.

- [ ] **Step 1: Replace the footer**

Replace the `<footer>...</footer>` block with:

```tsx
      <footer className="bg-(--background) py-12 border-t border-(--border) text-center" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4" suppressHydrationWarning>
          <h2 className="text-2xl font-bold text-(--foreground) mb-4">{footerContent.heading}</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8" suppressHydrationWarning>
            <AuthAwareSignupLink className={buttonVariants('primary', 'md')}>{footerContent.ctaPrimary}</AuthAwareSignupLink>
            <Link href="/dashboard" className={buttonVariants('secondary', 'md')}>{footerContent.ctaSecondary}</Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-(--muted)" suppressHydrationWarning>
            <Link href="/terms" className="hover:text-(--accent)">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-(--accent)">Privacy Policy</Link>
          </div>
          <p className="mt-8 text-xs text-(--muted)" suppressHydrationWarning>{footerContent.creatorCredit}</p>
        </div>
      </footer>
```

Implementer note: `footerContent.creatorCredit` (defined in `src/lib/content.ts` as `"Built by a software engineer who understands the job search struggle."`) was previously defined but never rendered anywhere in the file — this task starts rendering it, as a small added line under the terms/privacy links. This is a genuine, minor content-surfacing change (not a copy change — the text already existed in `content.ts`), worth calling out in the commit message.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no output (exit code 0)

Run: `npm run lint`
Expected: 0 errors (same 4 pre-existing unrelated warnings in `src/app/api/*` are fine).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(design): restyle footer with tokens, surface previously-unused creatorCredit line"
```

---

### Task 4: Visual verification against the resumax.ai reference

**Files:** none (verification only)

- [ ] **Step 1: Screenshot all three sections**

The dev server should already be running at `http://localhost:3000`. Use Playwright to navigate there, scroll to Pricing, FAQ, and Footer in turn, and take a screenshot of each at a desktop viewport (1440px). Also click one FAQ row open to confirm the accordion still expands/collapses correctly with the new styling.

- [ ] **Step 2: Compare against the resumax.ai reference**

The reference screenshots from the original design-research session (session scratchpad — `pricing-1.png`/`pricing-2.png` for pricing, `faq.png` for the FAQ/footer pattern) showed: 3-card pricing grid with a bordered+badged best-value card, and a border-row FAQ list with "OPEN"/mono labels. Report to the user:
- Does the best-value pricing card stand out (accent border + badge) without looking broken?
- Do the FAQ rows read as one clean bordered list, and does clicking a row still expand/collapse it correctly?
- Does the footer render cleanly with the newly-surfaced creator-credit line?

- [ ] **Step 3: Report to user**

Show the screenshots and comparison notes. This completes Phase 1 (the full landing page) — after this, the design spec's remaining phases are Auth (Phase 2), Dashboard shell (Phase 3), and Resume builder (Phase 4), each needing its own planning pass.
