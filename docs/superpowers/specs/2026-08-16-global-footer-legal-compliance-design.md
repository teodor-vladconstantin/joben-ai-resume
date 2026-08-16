# Global Footer + Legal Compliance — Design

**Date:** 2026-08-16
**Status:** Approved by user, pending implementation plan

## Goal

Currently the only footer in the app lives inline in the homepage (`src/app/page.tsx:301-318`), sourced from `footerContent` in `src/lib/content.ts`. No other route (dashboard, settings, pricing, resume-examples, legal pages, auth) has a footer. This project:

1. Extracts a shared, global footer component and mounts it in the root layout so it appears on every route except the full-screen CV/cover-letter editor.
2. Adds the mandatory ANPC SAL dispute-resolution badge (Romanian legal requirement for commercial websites).
3. Adds a Product Hunt badge linking to the live PH listing.
4. Leaves a separate, unrelated mechanical cleanup (removing em dashes from user-facing copy sitewide) to be done after, with no design needed for it.

Out of scope (explicitly deferred by user): trader/company legal identification block (CUI, registered office, etc.) — the product does not currently operate under a registered legal entity, so this section is skipped entirely for now.

## Legal research findings (informs Task 2)

- **ANPC SAL** (Ordin ANPC 449/2022, updated by OPANPC 270/2026): commercial websites must display the SAL pictogram (official spec: 250×50px) linking to `https://reclamatiisal.anpc.ro`, verified by ANPC on the homepage. Non-compliance fine: 2,000–100,000 lei.
- **SOL / EU ODR is dead**: the old EU Online Dispute Resolution platform (`ec.europa.eu/consumers/odr`) was shut down; Regulation (EU) 2024/3228 repealed Regulation 524/2013, and ANPC's own May 2026 update to Order 449/2022 explicitly removed SOL references. Do **not** link to the old ODR platform — many still-online guides are stale on this point.
- **Trader identification** (Legea 365/2002, OUG 34/2014) is normally required (company name, CUI, registered office, contact) but is explicitly out of scope per user decision — no registered entity yet.
- `/privacy`, `/terms`, `/cookies` already exist from the 2026-07-12 GDPR compliance plan and satisfy the privacy-policy-accessible-from-footer requirement.
- Official SAL pictogram: ANPC only distributes it inside a `.docx` (`anpc.ro/wp-content/uploads/2026/05/Anexa-2-pictograma-2.docx`), no direct image URL exists. It was downloaded and the embedded PNG extracted (`word/media/image1.png`, 500×124px — not exactly the 250×50 spec ratio, but it's the actual asset ANPC distributes). To be committed to `public/legal/anpc-sal-badge.png` during implementation.
- Product Hunt: product is live at `https://www.producthunt.com/products/joben` (maker: Duku Constantin). No PH `post_id` could be recovered (client-rendered page), so the official `embed-image` widget isn't usable without the user pulling it from their own PH dashboard later. Implementation uses a simple icon+text link badge instead, not the official PH widget image.

## Architecture

### New component: `src/components/layout/SiteFooter.tsx`

A slim, server-renderable footer (no client interactivity needed beyond plain `<Link>`s):
- Brand name + one-line tagline
- Product nav links: Pricing, Resume Examples, Free ATS Checker
- Legal links: Terms & Conditions, Privacy Policy, Cookie Policy
- SAL badge: `<Image>` of `public/legal/anpc-sal-badge.png` wrapped in a link to `https://reclamatiisal.anpc.ro`, with descriptive `alt` text
- Product Hunt badge: small icon + "Vezi-ne pe Product Hunt" text, linking to `https://www.producthunt.com/products/joben`, `target="_blank" rel="noopener noreferrer"`
- Copyright / creator credit line (reworded to drop the existing em dash)

Styling reuses existing CSS custom properties (`--background`, `--foreground`, `--muted`, `--border`, `--accent`) per the codebase's Tailwind conventions — no hardcoded colors.

### New component: `src/components/layout/ConditionalFooter.tsx` (client)

A thin client wrapper using `usePathname()` from `next/navigation` to decide whether to render `<SiteFooter />`. Excluded route patterns (full-screen editor, no footer):
- `/resumes/new`
- `/resumes/[id]` (i.e. `/resumes/*` except the literal `/resumes` list page)
- `/cover-letters/new`
- `/cover-letters/[id]` (i.e. `/cover-letters/*` except the literal `/cover-letters` list page)

All other routes (including `/`, `/dashboard`, `/settings`, `/pricing`, `/resume-examples*`, `/free-ats-checker`, `/terms`, `/privacy`, `/cookies`, `/sign-in`, `/sign-up`, `/feedback`, `/ai-review*`) render the footer.

A client wrapper is chosen over restructuring routes into route groups because it's the smaller, lower-blast-radius change — no files need to move, and the root layout gains one new element.

### `src/app/layout.tsx`

Mount `<ConditionalFooter />` once, after `<ClientProviders>{children}</ClientProviders>`, so it always sits at the bottom of the flex-column body regardless of route.

### `src/app/page.tsx`

The existing homepage footer block (lines 301-318) is split:
- The CTA heading + two buttons (`footerContent.heading`, `ctaPrimary`, `ctaSecondary`) stay as a homepage-only section, rendered just above where `<SiteFooter />` will now appear (mounted globally by the layout, not re-rendered locally).
- Everything else currently in that block (terms/privacy/cookies links, the GDPR badge line, creator credit) is removed from `page.tsx` since it now lives in the shared `SiteFooter`.

### `src/lib/content.ts`

`footerContent` keeps only the CTA-related fields (`heading`, `ctaPrimary`, `ctaSecondary`) for the homepage section. A new export (e.g. `siteFooterContent`) holds the shared footer's copy (tagline, creator credit reworded without an em dash).

## Task 2: em dash cleanup (separate, mechanical)

After the footer work lands: grep the codebase for the em dash character (`—`) across `src/**/*.{ts,tsx}` (user-facing strings only — JSX text, template literals rendered to the UI, and any content in `src/lib/content.ts` / legal page copy). Replace each with the punctuation that reads naturally in context (period, comma, parentheses, or "and"/"or" as appropriate) — not a mechanical find/replace with one fixed substitute. Out of scope: em dashes inside comments, non-UI strings (e.g. internal log messages), and markdown docs under `docs/`.

## Testing / verification

- `npx tsc --noEmit` and `npm run lint` after each task.
- Manual browser check: footer renders on `/`, `/dashboard`, `/pricing`, `/settings`, `/terms` and is absent on `/resumes/new` and an existing resume's builder URL.
- Manual check: SAL badge image loads and links to `reclamatiisal.anpc.ro`; PH link opens `producthunt.com/products/joben`.
- Grep confirms zero remaining `—` characters in `src/**/*.{ts,tsx}` UI-facing strings after Task 2.
