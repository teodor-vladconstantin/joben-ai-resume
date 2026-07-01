# Joben visual redesign — resumax.ai style reference

## Goal

Replicate the visual style, layout, component patterns, and animation behavior of resumax.ai across Joben's landing, auth, dashboard, and resume builder, with Joben's own accent color (`#2CB87A`) and 100% Joben content/branding/business logic. No resumax copy, testimonials, or feature claims — visual language and structure only.

## Source material

All observations below came from live Playwright sessions against `https://resumax.ai` (logged-out marketing pages + the user's own logged-in dashboard/builder, confirmed by the user to be their account). Screenshots live in the session scratchpad (not committed — ephemeral reference only, re-derivable by re-running the same Playwright walkthrough if needed).

## 1. Design tokens

### 1.1 Color — resumax original

| Token | Value | Role |
|---|---|---|
| `background` | `#0A0A0E` | page background (near-black, cool/blue-tinted, not pure black) |
| `card` / `surface` | `#12121A` | cards, sidebar, panels |
| `surface-elevated` | `#1A1A24` | popovers, raised elements |
| `foreground` | `#F5F1EB` | primary text (warm cream, not pure white) |
| `muted-foreground` | `#8A8A92` | secondary text |
| `text-faint` | `#5E5E66` | tertiary/disabled text |
| `border` | `#F5F1EB` at 8% alpha (`#F5F1EB14`) | dividers, outlines |
| `primary` / `accent` / `ring` | `#E879A3` (pink) | CTAs, highlights, focus rings |
| accent hover | `#F5A1C0` | lightened accent on hover |
| accent muted | `#E879A3` at 12% alpha (`#E879A31F`) | subtle fills (keyword highlight pills, badges) |
| `destructive` | `#EF4444` | standard semantic red, unrelated to brand hue |
| `radius` | `0.625rem` (10px) base, `1rem` for large cards | |

Stack: Tailwind v4 (`@import "tailwindcss"`) + shadcn/ui tokens (`--card`, `--popover`, `--primary`, `--ring`, `--muted`, `--accent`, `--input`, etc.), CSS custom properties on `:root`, default Tailwind gray/red/green/etc. scales re-expressed via `lab()` (not brand-relevant, just their theme generation method).

### 1.2 Color — Joben adaptation (approved)

Keep the neutral scale identical to resumax (it's part of the "visual style" being replicated), swap only the accent hue from pink to Joben green, preserving the same proportional relationships (hover lightening, muted opacity, radius).

| Token | Value |
|---|---|
| `background` | `#0A0A0E` |
| `card` / `surface` | `#12121A` |
| `surface-elevated` | `#1A1A24` |
| `foreground` | `#F5F1EB` |
| `muted-foreground` | `#8A8A92` |
| `text-faint` | `#5E5E66` |
| `border` | `#F5F1EB14` |
| `primary` / `accent` / `ring` | `#2CB87A` |
| accent hover | `#4FD69B` (lighter, same hue/sat relationship as resumax's +11L hover step) |
| accent muted | `#2CB87A1F` (12% alpha) |
| `destructive` | `#EF4444` (unchanged, semantic) |
| `radius` | `0.625rem` base, `1rem` large cards |

Exact hover/muted hex values get finalized in code via a proper OKLCH/HSL scale derivation during Phase 0 implementation, not hand-picked — the values above are the target ballpark.

### 1.3 Typography

- **UI/body/headings**: native system sans stack (`ui-sans-serif, system-ui, sans-serif, ...`) — no custom sans webfont loaded. Consistent tight tracking on headings.
  - H1: 88px / weight 600 / letter-spacing -3.08px / line-height 89.76px
  - H2: 56px / weight 600 / letter-spacing -1.68px
  - Body: 16px / weight 400
  - Big numbers (price, stats): 44px / weight 600 / letter-spacing -0.88px
- **Pull quotes / testimonials**: Instrument Serif, 48px / weight 400 — deliberate contrast against the geometric sans.
  - Joben doesn't currently load this font; add via `next/font` (Google Fonts, matches existing CSP allowance for Google Fonts per recent commit).
- **Eyebrow labels / data / mono UI bits**: monospace (Geist Mono / JetBrains Mono equivalent — Joben can use `next/font` mono, e.g. JetBrains Mono), uppercase, wide tracking. Used for step counters ("01/05"), table columns, secondary price captions, ambient background text.

### 1.4 Spacing & radius

- Base radius 10px (`0.625rem`), large cards/modals 16px (`1rem`), buttons/badges fully pill (`rounded-full`).
- Flat design — no heavy box-shadows; depth comes from surface color steps (`background` → `card` → `surface-elevated`) and 8%-opacity borders, not shadows.

## 2. Component inventory

- **Buttons**: primary = pill (`rounded-full`), solid accent fill, dark text on accent, hover = lighter accent, `transition-colors`. Secondary = outline, transparent fill, border at low opacity.
- **Cards**: `surface` background, 8%-opacity border, 10–16px radius, no shadow.
- **Badges/pills**: fully rounded, small caps or mono text, used for "BEST VALUE", status dots, keyword highlights.
- **Hero word-rotator**: headline cycles through a role/value word (resumax: engineers/designers/PMs/ML engineers), current word colored accent, absolute-positioned duplicate technique for width measurement + slide/fade swap.
- **Ambient background texture**: very-low-opacity scattered monospace text field behind the hero (resumax: fake job-tracker snippets). Joben equivalent: scattered resume/ATS-flavored fragments (score deltas, "bullet rewritten", "keyword matched", etc.) — own content, same visual technique.
- **Scrollytelling step section**: sticky/pinned two-column layout, left = eyebrow "0X/05" + category label (accent) + heading + paragraph + accent-bullet list, right = pinned demo visual card that swaps per step as user scrolls through a tall scroll region.
- **Count-up stats**: large numbers animate from 0 to target value on scroll-into-view.
- **Logo marquee**: grayscale wordmark strip, auto-scrolling, "USERS AT" style eyebrow. (Joben: use its own credibility markers, not fabricated company names — content TBD with user, don't invent claims.)
- **Testimonial carousel**: centered serif quote, attribution line, avatar thumbnails below, "0X/0Y" counter top-right, "HIRED"-style status eyebrow with accent dot.
- **Pricing cards**: 3-tier, "best value" card gets accent border + pill badge, monthly/annual toggle pill switch, feature list with accent checkmarks, full comparison table below, dedicated FAQ block.
- **FAQ accordion**: border-top/bottom rows, question left + "OPEN"/"CLOSE" mono label right (no chevron icon).
- **Dashboard sidebar**: fixed left nav, logo + collapse toggle, search trigger (⌘K), primary nav icons+labels, secondary "Resources" section with external-link arrows, settings pinned at bottom.
- **Dashboard home**: step-checklist hero card (numbered steps, Done/Now/Next status pills, connecting vertical line, per-step CTA), right column of suggestion cards (quick win / in progress / level up patterns).
- **Resume builder**: 3-column shell — app sidebar, edit panel (readiness/completeness score, section list with lock/edit affordances, template + font + font-size pickers), live preview panel (white A4 page, "LIVE PREVIEW · EXACT MATCH TO YOUR DOWNLOAD" label). Top bar: back button, editable title, save-status pill, primary action (tailor), secondary export actions.
- **Auth**: centered card, subtle radial accent glow behind it, eyebrow "SIGN IN", heading, OAuth buttons full-width, Terms/Privacy footnote, "back to home" link, small mono caption bottom-right.

## 3. Animation inventory

| Pattern | Behavior |
|---|---|
| Hero word-rotate | Cycles a word every ~2s, accent color, slide/fade transition |
| Ambient background | Static or very-slow-drifting low-opacity text field, no user interaction |
| Scroll-pin steps | Section pins in viewport while inner content advances across ~5 steps as user scrolls through an extended scroll region |
| Count-up stats | Number animates 0 → target once scrolled into view (IntersectionObserver, run-once) |
| Card/button hover | Color transition only (no scale/shadow pop) — `transition-colors` |
| FAQ accordion | Expand/collapse height, label swaps OPEN ↔ CLOSE |
| Testimonial carousel | Auto-advance or manual via avatar click, crossfade |

Implementation: `framer-motion` (already a Joben dependency) covers all of the above. `lenis` (smooth-scroll library, detected via `class="lenis"` on resumax's `<html>`) is not currently a Joben dependency — evaluate adding it in Phase 0 if the scroll-pin sections feel wrong without it; not a hard requirement.

## 4. Page/section mapping — Joben content (approved)

### 4.1 Landing page sections (in order)

1. **Navbar** — logo, nav links, Sign in, Start free CTA (pill, accent).
2. **Hero** — word-rotate headline + ambient background texture. Joben copy stays close to current `heroContent` messaging (ATS rejection framing), restyled only.
3. **Resume score showcase** — mirrors current `atsPreviewContent` (score 93, strengths, before/after) but in resumax's two-floating-card-over-mockup layout (circular gauge + category breakdown card, overlapping a resume image).
4. **5-step product loop** (approved content, own visual per step, sticky scroll-pin):
   - **01 · Score** — "See your score before you apply." Upload/paste resume → 0–100 ATS score across categories + strengths/improvements. Visual: circular gauge + breakdown bars.
   - **02 · Tailor** — "Tailor your resume to the job description." Paste a JD → keyword match/gaps highlighted, bullets rewritten for that role. Visual: JD keyword-highlight card + before/after bullet card. Maps to real "resume-tailoring runs (CV vs JD)" feature.
   - **03 · Rewrite** — "Turn weak bullets into quantified wins." One-click AI bullet rewrite: adds metrics, strong verbs, keeps user's voice. Visual: bullet list with before/after toggle. Maps to real "AI bullet rewrites" / auto-fix feature.
   - **04 · Cover Letter** — "A cover letter that matches your resume and the job." AI-generated, consistent tone, tailored to the same JD. Visual: cover letter preview card with personalized lines highlighted. Maps to real "AI cover letters" feature.
   - **05 · Export & Manage** — "Export clean, keep every version organized." ATS-ready PDF/DOCX export, multiple saved tailored resumes managed from the dashboard. Visual: saved-documents grid with export actions. Maps to real "Save up to N CVs" / unlimited exports feature. Explicitly **not** an application-status tracker — Joben has no job/application tracking, so this step must not imply one.
5. **Pricing** — existing `pricingPlans` (Free / Pro / Recruiting Plan) restyled into resumax's 3-card + toggle + comparison table pattern. Business logic/Stripe/tiers unchanged, visual only.
6. **FAQ** — existing `faqItems`, restyled into border-row accordion pattern.
7. **Footer** — existing `footerContent`, restyled into resumax's column layout (brand blurb + social + link columns).

**Deferred (not in Phase 1):** social-proof count-up stats + logo marquee, and the testimonial carousel. Confirmed with user (2026-07-01) — no real numbers/testimonials to show yet, and fabricating them is out of scope. Revisit as a later addition once real data/quotes exist; the component patterns are documented in §2/§3 so they can be added without re-deriving the design.

### 4.2 Auth (sign-in / sign-up)

Restyle via Clerk `appearance` config (`lib/clerk-appearance.ts`) to match: centered card, radial accent glow behind it, pill OAuth buttons, Terms/Privacy footnote, back-to-home link. No change to Clerk logic/providers.

### 4.3 Dashboard shell

Restyle `src/app/dashboard/page.tsx` and shared nav chrome: sidebar nav pattern, step-checklist / suggestion-card home layout — mapped to Joben's actual dashboard data (resumes, cover letters, scores), not resumax's job-search concepts.

### 4.4 Resume builder

Restyle `src/app/resumes/[id]` (and `resumes/new`) toward the 3-column shell (edit panel + live preview), preserving all existing builder logic/state — visual/layout pass only.

## 5. Execution plan (phased, confirmed)

Each phase/section follows the user's mandated loop: implement → run `npm run dev` → Playwright screenshot of the Joben result → compare against the captured resumax reference → present the comparison → wait for confirmation → proceed.

- **Phase 0** — New branch `redesign/resumax-style`. Design tokens (`globals.css` + Tailwind theme), font loading (Instrument Serif, mono), shared primitive restyle (Button, Card, Badge, Accordion). No pages yet.
- **Phase 1** — Landing page, section by section per §4.1 (7 sub-steps, each individually screenshotted/confirmed).
- **Phase 2** — Auth (sign-in/sign-up via Clerk appearance).
- **Phase 3** — Dashboard shell.
- **Phase 4** — Resume builder.

## 6. Explicit constraints

- Content is 100% Joben — no resumax copy, testimonials, company logos, or feature claims that Joben doesn't actually have.
- Pricing/business logic (Stripe price IDs, tier limits) unchanged — visual restyle only.
- No fabricated stats, testimonials, or "hired at" logos — use real Joben numbers/content or omit the element, confirm with user before inventing placeholder content.
- Neutral color scale and accent-hue swap as specified in §1.2 — not a full from-scratch palette.
