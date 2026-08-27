## Active
- [DONE] 2026-08-27 Fix suprascriere silențioasă în tailor (templates, gap ESCO,
  anti-halucinație deja livrate — neatinse):
  - Problemă: `handleTailorResume()` scria direct `bullets[0]` al fiecărui job în `resumeData`
    fără preview/confirmare (bullet-urile fără `newClaims` ocoleau garda anti-halucinație
    construită la pasul anterior, care ținea "pending" doar bullet-urile marcate).
  - Fix: TOATE bullet-urile propuse de tailor (nu doar cele cu claim-uri noi) devin patch-uri
    "pending" arătate în `BeforeAfterModal` existent (mod `onConfirm`, deja construit) — nimic nu
    se scrie în `resumeData` fără accept explicit. Checkbox-ul obligatoriu de confirmare rămâne
    doar pe bullet-urile cu `newClaims`, ca înainte.
  - Decizie de scop: am extins gate-ul și la `personal.summary` (parte din același răspuns
    tailor) — altfel summary s-ar aplica silențios chiar dacă bullet-urile așteaptă confirmare,
    o stare inconsistentă. Ținut într-un state separat (`pendingTailorSummary`), aplicat doar la
    confirmare, golit explicit și la discard (altfel ar putea "scăpa" aplicat la o confirmare
    ulterioară neînrudită, ex. accept pe un improve-bullet separat).
  - Nu am construit UI nouă — reutilizat `BeforeAfterModal` exact cum exista.
  - Verificare: `npx tsc --noEmit` curat, `npm run lint` curat, `npm run test` 185/185 (fără
    teste noi — schimbare de comportament în ResumeBuilder, deja acoperit indirect de
    suita existentă; test manual descris de user rămâne de rulat de el).
  - Autoverificare diff: fluxul discard curăță și `pendingTailorSummary` (altfel putea "scăpa"
    aplicat la o confirmare ulterioară neînrudită) — nicio altă problemă găsită.
- [DONE] 2026-08-27 Poarta anti-halucinație (Faza 1 pas 3; templates și variante
  multiple per bullet rămân neatinse, per decizie user):
  - `src/lib/claim-diff.ts` (nou): `findNewNumberClaims` (pur, sincron, compară cifra "goală"
    fără % ca reformatarea 27→27% să nu fie marcată fals ca nouă) + `findNewClaims` (async —
    trebuie să fie, cheamă `/extract-skills` pentru unelte/tehnologii noi via corpusul ESCO
    deja expus la Tailor v2 pas 1; fail-open pe eroare de rețea, cifrele tot se detectează).
  - `src/app/api/improve-bullet/route.ts`: rulează `findNewClaims` după răspunsul Claude,
    output devine `{ bullet, newClaims }`.
  - `src/app/api/tailor/route.ts`: `findNewClaims` per bullet rescris, `context` = celelalte
    bullet-uri ale aceluiași job (nu doar title/company/period) — altfel o cifră mutată din alt
    bullet e marcată fals ca nouă. `bulletClaims: string[][]` adăugat în `tailorResponseSchema`.
  - `src/components/ui/BeforeAfterModal.tsx`: extins cu mod opțional de confirmare (`onConfirm`
    prop) — highlight pe claim-urile noi + checkbox obligatoriu per patch, buton "Apply" activ
    doar când toate checkbox-urile sunt bifate. Fără `onConfirm`, comportamentul vechi
    (auto-fix/apply-fix, deja aplicat) rămâne 100% neschimbat.
  - `src/components/builder/ResumeBuilder.tsx`: `handleGenerateBulletDraft` trimite acum toate
    bullet-urile jobului ca `context`; `handleAcceptBulletDraft` și `handleTailorResume` țin
    bullet-urile cu claim-uri noi în stare "pending" (nu se scriu în `resumeData`) până la
    confirmare explicită prin noul modal; bullet-urile fără claim-uri noi se aplică direct, ca
    înainte.
  - Teste noi: `tests/lib/claim-diff.test.ts` (9 cazuri: cifră nouă, reformulată, mutată din alt
    bullet al aceluiași job, dedup, fallback la eșec de rețea, unelte noi via ESCO).
  - Verificare: `npx tsc --noEmit` curat, `npm run lint` curat, `npm run test` **185/185**
    (176 anterioare + 9 noi).
  - Autoverificare diff: nicio problemă găsită — logica e fail-open, bullet-urile fără claim-uri
    noi continuă să se aplice direct ca înainte, fluxul auto-fix/apply-fix (fără `onConfirm`)
    neatins.
  - Rămâne: commit + push + deploy (Vercel auto-deploy pe push la `main`; nu ține de Hetzner,
    `improve-bullet`/`tailor` sunt rute Next.js) — neexecutat, aștept decizia userului.
- [DONE] 2026-08-27 Free ATS checker: eliminat warning-uri fals-pozitive despre cronologie
  (`src/app/api/public/ats-check/route.ts`, `ATS_CHECK_SYSTEM_PROMPT`). Root cause: prompt-ul
  ruta publică nu avea garda "concurrent roles are normal / past end date is not ambiguous"
  care exista deja în `src/app/api/analyze/route.ts` (adăugată acolo separat) — modelul
  inventa probleme de genul "overlapping Present roles" (normal, founder + job) și "end date
  în trecut e inconsistent" (fals, un rol fără "Present" e pur și simplu încheiat). Portat
  aceleași 3 reguli explicite în prompt-ul rutei publice. `withCurrentDateContext` (fix-ul
  anterior din f96f052) rămâne corect — problema nu era lipsa datei curente, ci lipsa
  regulilor de interpretare a ei. Verificat: `tsc --noEmit` + `eslint` curate pe fișierul
  modificat.
- [DONE] 2026-08-27 Tailor v2 pas 1 — gap de skill-uri (doar gap-ul; template-uri, variante
  multiple și anti-halucinație rămân neatinse, per decizie user):
  - Context/descoperire: `resume-parser-service/app/main.py` + `app/services/skills_matcher.py`
    (ESCO/seed skill matcher) NU erau desfășurate în producție — `Dockerfile` face `COPY main.py .`
    doar pentru fișierul de la rădăcină (LlamaParse + Claude, cu `require_parser_secret`). Am mutat
    `skills_matcher.py` la rădăcină (lângă `main.py` real) în loc de a adăuga endpoint-ul în codul
    orfan din `app/`, ca să fie efectiv livrabil — deviere de la instrucțiunea inițială (care indica
    `app/main.py`), semnalată userului înainte de a proceda.
  - `resume-parser-service/skills_matcher.py`: copiat din `app/services/skills_matcher.py`, doar
    `_BUNDLE_DIR` corectat pentru noua locație. Notă: bundle-urile ESCO reale
    (`esco_skills_en.json`/`esco_skills_ro.json`) nu există în `data/` — matcher-ul rulează azi pe
    seed list-ul hardcodat (~130 skill-uri tech EN + ~16 soft skills RO), nu pe corpusul ESCO complet
    de 13.890 intrări. Funcțional pentru v1, dar de reținut ca limitare cunoscută.
  - `resume-parser-service/main.py`: nou `POST /extract-skills` (body `{text, lang}`, cap 20.000
    caractere), autentificare identică cu `/parse` (`require_parser_secret`), folosește
    `SkillsMatcher().extract_from_text()` neschimbată.
  - `resume-parser-service/requirements.txt` + `Dockerfile`: adăugat `rapidfuzz==3.9.7` și
    `COPY skills_matcher.py .`.
  - `src/lib/resume-parser-client.ts` (nou): helper de proxy către resume-parser-service,
    generalizat din tiparul `fetchParser`/`RESUME_PARSER_URL`/shared secret din
    `src/app/api/parse/route.ts` (`parse/route.ts` însuși neatins — risc minim, rută funcțională
    neschimbată).
  - `src/lib/skill-gap.ts` (nou): logică pură testabilă — `extractSkillGapInputText` (text din
    resumeData: summary, dynamicSections tip skills, bullets/descrieri experience+projects,
    technologies) + `computeMissingSkills` (diff case-insensitive JD vs. CV, dedup).
  - `src/app/api/tailor/route.ts`: apelează `/extract-skills` de două ori (CV + JD) în paralel,
    fail-open per apel (dacă parserul e jos, tailoring continuă cu gap gol în loc să pice cererea),
    include gap-ul explicit în promptul Claude, validează output-ul final cu `tailorResponseSchema`.
  - `src/lib/validation/schemas.ts`: `tailorResponseSchema` nou — prima validare Zod a output-ului
    de tailor (înainte trecea negestionat direct din `parseClaudeJsonText`); extinsă cu
    `missingSkills: string[]`.
  - `src/components/builder/ResumeBuilder.tsx`: panou nou de chips cu `missingSkills`, poziționat
    deasupra modalului de tailor (lângă `fixBanner`, cu dismiss). `handleTailorResume()` neatins
    dincolo de a primi/afișa `missingSkills` — comportamentul de suprascriere silențioasă a
    `bullets[0]` rămâne cum era.
  - Teste noi: `tests/lib/skill-gap.test.ts` (12 cazuri: diff, case-insensitivity, dedup, extracție
    text defensivă pe input malformat).
  - Verificare: `npx tsc --noEmit` curat, `npm run lint` curat, `npm run test` 176/176 (prima
    rulare a arătat 22 timeout-uri pe teste neatinse de acest task — confirmat flake de mediu prin
    a doua rulare curată, nu regresie introdusă de această schimbare).
  - Rămâne de făcut (necesită acces/decizie user): deploy real pe Hetzner (rebuild imagine Docker
    resume-parser-service cu `docker compose -f docker-compose.prod.yml build resume-parser` +
    restart) și setare `RESUME_PARSER_SHARED_SECRET` dacă diferă; verificare manuală end-to-end
    (CV fără skill X + fișă de post cu skill X → apare în `missingSkills`).
- [IN PROGRESS] 2026-08-26 Full codebase audit + E2E testing + cleanup (delta pass, per user
  scoping decision — not a ground-up re-audit; prior FAZA 0-4/polish passes already covered
  broad dead-code/lint/console.log/TODO sweeps and were confirmed still holding):
  - [DONE] Confirmed baseline before touching anything: `npm test` 165/165 passing (the
    previously-flagged `crud-smoke.test.ts` failure was already fixed by commit
    `eb49e4b`), `npx tsc --noEmit` clean, real `npm run lint` clean on `src/`/`tests/`/`scripts/`
    (the reported 14298-problem count was 100% stale build noise from the separate
    `.claude/worktrees/gdpr-compliance` git worktree, not this working tree).
  - [DONE] Fixed `.gitignore`: its last line (`cleanup-reports/`) had been appended as
    UTF-16LE text into a UTF-8 file (literal null bytes between characters, likely from a
    PowerShell `>>`/`Out-File` append), so git silently ignored the pattern — this is why
    `cleanup-reports/` showed as untracked. Rewritten in plain UTF-8; added `/e2e/.auth/`,
    `/e2e/.results/`, `/e2e/.report/`, `/test-results/`, `/playwright-report/`,
    `/blob-report/` for the new Playwright suite.
  - [DONE] `eslint.config.mjs`: added `.claude/worktrees/**` to `globalIgnores` so the
    separate worktree's own `.next`/`node_modules` never get scanned again — permanently
    fixes the false 14k-problem lint count instead of just re-documenting it as noise.
  - [DONE] `package.json`: added `@sentry/core` as an explicit dependency (was unlisted —
    `src/lib/security/sentry-scrub.ts` imports it directly but it was only ever present
    transitively via `@sentry/nextjs`); added `test:e2e`/`test:e2e:ui` scripts.
  - [DONE] `npx knip` re-run and every finding manually verified via grep before deciding:
    - Confirmed genuinely dead (recommended for deletion, see below):
      `src/components/layout/Sidebar.tsx` (a fully orphaned duplicate/superseded-by
      `src/components/dashboard/Sidebar.tsx`, including its unused `DashboardShell` export)
      and `src/components/pricing/UpgradeToProButton.tsx` (superseded by `PlanCta` per the
      2026-08-14 Stripe live-payments entry below — zero remaining imports of either).
    - Confirmed false positives, left alone: `@napi-rs/canvas` (real runtime `require()` +
      `serverExternalPackages` usage in `next.config.ts`, knip can't see dynamic requires),
      `supabase` devDependency (CLI-only, per README/CLAUDE.md commands, never imported),
      `latex-service/index.js` (real Docker entrypoint for the separate microservice, knip
      scanned it as if it were part of the main app).
    - Deliberately NOT deleted: the ~45 "unused export" / 18 "unused exported type" findings
      in `src/lib/validation/schemas.ts`, `src/lib/api-response.ts`, `src/lib/plans.ts`, etc.
      These overlap directly with two *open* backlog items further down this file ("unify
      API error-response shapes", "add Zod validation for hand-parsed query params") — they
      read as prepared-but-not-yet-wired infrastructure for that work, not accidental dead
      code, and this was scoped as a delta pass, not a redesign. Flagged here instead so
      whoever picks up those backlog items knows the scaffolding already exists.
  - [BLOCKED — needs user action] Deleting the two confirmed-dead files above and the stale
    `cleanup-reports/` directory (leftover, garbled-UTF-16, untracked scratch output from an
    earlier FAZA 1 knip/depcheck/jscpd run that was never cleaned up) — the sandbox's Bash
    classifier blocks all file-deletion attempts (`rm`, `git rm`) in this session. Run
    manually: `git rm src/components/layout/Sidebar.tsx src/components/pricing/UpgradeToProButton.tsx && rm -rf cleanup-reports`
  - [DONE] Added Playwright E2E (`playwright.config.ts`, `e2e/`) — none existed before.
    `e2e/public/**` (marketing/legal pages, sign-up legal-gate, protected-route redirect,
    wrong-password sign-in) needs no secrets and is verified passing (8/8) against the
    current `.env.local`. `e2e/authenticated/**` (dashboard nav, resume CRUD incl. a
    not-found edge case, Stripe checkout boundary test) needs test-mode Clerk + Stripe
    credentials the user must supply in a new `.env.test.local` (see
    `.env.test.local.example` and the README's new "End-to-End Tests" section) — not run
    yet, blocked on those credentials. `playwright.config.ts` hard-refuses to start if it
    detects `_live_` in any Clerk/Stripe key, specifically to prevent this suite from ever
    touching production. `e2e/global-setup.ts` creates/reuses a throwaway Clerk test user via
    the Backend API and seeds the matching `users` row directly (mirrors the
    `user.created` webhook handler) since local runs have no webhook forwarder.
  - [ ] Once `.env.test.local` is filled in: run `npm run test:e2e` in full (authenticated
    project currently unverified) and fix anything it surfaces.
  - [ ] User to run the two blocked deletions above, or grant this session `rm`/`git rm`
    permission to do it directly.
- [DONE] 2026-08-16 Global footer + ANPC SAL/Product Hunt badges + em-dash cleanup:
  - New `src/components/layout/SiteFooter.tsx` (slim, sitewide) mounted via
    `src/components/layout/ConditionalFooter.tsx` in `src/app/layout.tsx`; hidden on
    `/resumes/new`, `/resumes/[id]`, `/cover-letters/new`, `/cover-letters/[id]` (full-screen
    editor) via `usePathname()`, shown everywhere else.
  - Homepage (`src/app/page.tsx`) keeps its CTA block as a standalone section above the
    shared footer instead of duplicating footer content; `footerContent`/`siteFooterContent`
    split in `src/lib/content.ts`.
  - ANPC SAL badge: official pictogram (extracted from ANPC's `.docx` asset, no direct image
    URL exists) in `public/legal/anpc-sal-badge.png`, linking to `reclamatiisal.anpc.ro` per
    Ordin ANPC 449/2022 as updated by OPANPC 270/2026. Deliberately no SOL/EU ODR link (that
    platform was retired by Reg. EU 2024/3228; ANPC removed the reference). Trader/company
    identification (CUI, registered office) explicitly skipped per user decision (no
    registered legal entity yet) — design doc flags this as a future gap.
  - Product Hunt badge linking to `producthunt.com/products/joben` (simple icon+text link,
    not the official PH widget — no `post_id` could be recovered from the client-rendered PH
    page).
  - Em-dash cleanup: replaced stray `—` in user-facing copy (legal pages, error/status
    messages, landing content) with contextually appropriate punctuation; left untouched in
    code comments and `resume-parser.ts` regexes (those match em dashes as literal date-range
    separators in parsed resume text, not UI copy).
  - Verified: `tsc --noEmit` clean, `npm run lint` clean on all touched files (pre-existing
    ~14k problem count is the already-documented stale `.claude/worktrees/gdpr-compliance/.next`
    scan noise). Browser verification attempted but the Chrome extension tooling was not
    functional in this session (navigate reported success but tab state didn't stick after
    3 attempts) — page title/content were confirmed present via tab context before giving up
    on interactive screenshots; recommend a manual spot-check in a real browser.
  - Design doc: `docs/superpowers/specs/2026-08-16-global-footer-legal-compliance-design.md`.
- [IN PROGRESS] 2026-08-14 Stripe live payments (code-side work done; production cutover still needs manual
  Stripe/Vercel Dashboard steps — see RUNBOOK.md "Local Stripe Testing" and the pre-launch checklist below):
  - Re-enabled `/api/billing/checkout` (was hardcoded 403 since 2026-07-03) with rate limiting, recruiting-plan
    guard, and a new `CHECKOUT_DISABLED` env kill switch checked first.
  - Restored `src/lib/client-billing.ts` (`startProCheckout`, `startBillingPortal`).
  - Removed `UpgradeModal` entirely; pricing buttons now start checkout directly on click; the 4 quota-limit
    interstitial call sites (ResumeBuilder, CoverLetterBuilder, both ai-review pages) use a new
    `UpgradeBanner` component instead of a blocking dialog.
  - Added Stripe Billing Portal: `/api/billing/portal` + `ManageBillingButton` on the Settings page (which
    also now shows the real plan badge instead of a hardcoded "Free").
  - Added `src/lib/stripe.ts` shared client factory (de-duplicates the two inline `new Stripe(...)` calls).
  - Added `validateStripeLocalConfig()` to `src/lib/env.ts` (mirrors the existing Clerk live-key-on-localhost
    guard) — throws if `sk_live_...` is used with a localhost app URL, bypassable via
    `ALLOW_STRIPE_LIVE_ON_LOCALHOST`.
  - New test coverage: `tests/api/webhooks-stripe.test.ts` (22 cases — signature verification, idempotency,
    stale-event ordering, all 7 event branches, lifetime-recruiting non-downgrade interaction), rewritten
    `tests/api/billing-checkout.test.ts`, new `tests/api/billing-portal.test.ts`, new `tests/lib/env.test.ts`.
    Full suite: 150/150 passing. `tsc --noEmit` and `npm run lint` clean on all touched files.
  - Recreated `.env.prod.example`; fixed stale VPS-only deployment topology in CLAUDE.md/RUNBOOK.md (actual:
    Next.js on Vercel, only latex-service/resume-parser on the VPS); added RUNBOOK.md "Local Stripe Testing"
    section (`stripe listen`/`stripe trigger`).
  - Deliberately deferred (per user decision): merging `feat/payment-lifecycle-emails` branch
    (payment-failed/winback emails); `users_update_own` RLS `WITH CHECK` hardening (currently unreachable,
    no anon-key Supabase client exists in the app — low-priority defense-in-depth, not a go-live blocker).
  - Remaining before this can go fully live: the Phase 6 cutover checklist further down this file (Stripe
    Dashboard live product/price/webhook/portal setup, Vercel live env vars, smoke test) — these require
    account access this session doesn't have and must be done by the user.
  - 2026-08-16 follow-up (deep analysis for the live-mode cutover plan): found and fixed a real pre-launch
    bug — the pricing page's "Get Recruiting Plan" button silently started a **Pro** checkout (both cards
    had `isComingSoon: true`, which `PlanCta` treated as a generic "paid" flag routing to the single
    Pro-only `startProCheckout()`). Per user decision, made Recruiting Plan a real, separately-priced Stripe
    subscription instead of just hiding the bug: `/api/billing/checkout` now accepts `{ plan: 'pro' |
    'recruiting' }`; `src/lib/plans.ts` gained `resolvePlanFromPriceId`/`getPriceIdForPlan` as the shared
    price↔plan mapping used by both the checkout route and the webhook's `resolvePlanFromSubscription`
    (now price-ID-aware instead of hardcoded to `'pro'`); `PlanCta`/`content.ts`/`page.tsx` now pass an
    explicit `plan` instead of the `isComingSoon` reuse hack. Also bumped the pinned Stripe API version
    (`src/lib/stripe.ts`) to `2026-07-29.dahlia` and the `stripe` SDK to `22.5.0` (was `22.0.1`, whose types
    didn't support the new version string) — this surfaced a second, previously-missed inline `new
    Stripe(...)` in `src/app/api/account/delete/route.ts` still pinned to the old version, now switched to
    the shared `getStripeClient()` factory. New `STRIPE_RECRUITING_PRICE_ID` env var (added to
    `.env.prod.example`); `RUNBOOK.md`'s cutover checklist updated for the second live price + Customer
    Portal "switchable products" config. Verified end-to-end in the browser against a real (test-mode)
    Stripe session: "Upgrade to Pro" correctly opens a live test Checkout session; "Get Recruiting Plan"
    correctly 503s with "Billing is temporarily unavailable" (no `STRIPE_RECRUITING_PRICE_ID` configured
    locally yet) instead of silently charging the Pro price. Full suite: 164/165 passing — the one failure
    (`tests/api/crud-smoke.test.ts` > "blocks resume creation when cv feature limit is reached", expects 403
    gets 429) is pre-existing and unrelated to this work (a Supabase mock/rate-limit-vs-quota-check
    ordering issue in that test, confirmed failing in isolation before any of today's edits touched it —
    not fixed, flagged here for a separate pass). `tsc --noEmit` and `npm run lint` clean on all touched
    files (lint's ~14k pre-existing problem count is 100% the already-documented stale
    `.claude/worktrees/gdpr-compliance/.next` scan noise, confirmed none of it is in touched files).
- [DONE] 2026-08-13 Free-trial abuse prevention + security fine-tuning (Stripe untouched, per user request):
  - Faza 1: disposable-email blocking in Clerk webhook (`src/lib/security/disposable-email.ts`, new dep
    `disposable-email-domains`) — blocked signups get their Clerk user deleted, no `users` row created, no
    free-tier quota granted. Email normalization (trim+lowercase) added to `user.created`/`user.updated`.
  - Faza 2: server-side ToS/Privacy consent tracking (`users.tos_accepted_at/tos_version/signup_ip_hash` +
    `signup_consents` table, migration `20260813000000_add_signup_consent.sql`) + new
    `POST /api/signup/consent` (fails CLOSED with 503 if Redis is down — the one deliberate exception to
    this codebase's global fail-open rate-limit policy, since it's a low-traffic abuse gate not an AI-quota
    hot path), 6/hour per-IP throttle. Sign-up page now calls it before showing Clerk's form and threads the
    token through `unsafeMetadata`; webhook consumes it into the `users` upsert.
  - Faza 3: `src/lib/upstash.ts` (single Redis client source of truth, replaces duplicated construction in
    ratelimit.ts + health/route.ts) + `/api/cron/redis-health` pushes `logger.error`→Sentry on Upstash
    outage (previously silent). Confirmed user is on Vercel Hobby (2 cron jobs max, daily-only), which was
    already fully used by followup-7d/inactivity-3d — removed the 3rd `vercel.json` entry (would likely have
    broken deploy) and added `.github/workflows/redis-health-cron.yml` instead (pings every 30 min, free,
    no Vercel plan dependency). RUNBOOK.md #5 corrected (previously claimed fail-closed-with-503, code
    actually fails open by design).
  - Faza 4: `notifyAdmin()` abuse alerts (5+ hits/month/feature) now also `logger.error` (→ Sentry), and only
    fire once at the exact threshold crossing (`hits === 5`, was `>= 5`) to avoid alert spam.
  - Faza 5: fixed `ratelimit.ts`'s internal cached `getUserPlan()` to respect `GOD_MODE_EMAILS` (was
    inconsistent with `plans.ts`'s version used for actual AI-gating — could show a wrong capped status in
    the UI for up to 1h); deduplicated `parseAdminUserIds()` into `src/lib/security/admin.ts`; added
    `env.upstash.isConfigured` to `src/lib/env.ts`.
  - Verified: `tsc --noEmit` clean, `npm run lint` clean on all touched files (pre-existing ~1400
    error/warning count in `npm run lint` output is from eslint scanning a stale `.next` build dir inside
    `.claude/worktrees/gdpr-compliance/` — unrelated to this work, not fixed, flagged to user), full test
    suite 110/110 passing (2 new test files: `tests/security/disposable-email.test.ts`,
    `tests/api/signup-consent.test.ts`).
  - [DONE] Clerk Dashboard Faza 0 toggles enabled by user.
  - [DONE] Migration `20260813000000_add_signup_consent.sql` pushed to remote Supabase (project
    `vdgjxejunpfxvnpxyazq`) via `npx supabase db push` (no Docker needed — CLI connects to remote directly);
    `npx supabase migration list` confirms local/remote in sync for all 15 migrations.
  - [ ] User needs to add two GitHub repo secrets (Settings → Secrets and variables → Actions) for the new
    redis-health workflow to actually run: `PROD_APP_URL` (e.g. `https://joben.eu`) and `CRON_SECRET` (same
    value as the app's env var).
- [DONE] 2026-07-12 Analytics/observability setup: PostHog (fixed missing `.env.local` token — was silently
  a no-op), GA4 (`G-FBR6C4DH8B` via `@next/third-parties/google`, soft-nav pageviews are automatic per GA4
  Enhanced Measurement), Sentry (verified already fully wired: client/server/edge configs, tunnelRoute,
  global-error.tsx — no changes needed), Vercel Speed Insights + Web Vitals→PostHog (`WebVitalsReporter.tsx`).
  New `src/components/ClientProviders.tsx` consolidates all providers; `layout.tsx` simplified to use it.
  CSP (`next.config.ts`) extended for googletagmanager.com/google-analytics.com. Verified live in browser
  (PostHog + Sentry both round-tripped 200s to real backends; GA4/Vercel scripts render correctly in HTML/CSP
  but couldn't be network-verified from this sandboxed browser, which blocks external script loads).
  Follow-ups (not done, need user decision): (1) no `SENTRY_AUTH_TOKEN` in Dockerfile/CI → source maps
  aren't uploaded on the self-hosted Docker build, stack traces in Sentry will be minified; (2) `CLAUDE.md`
  "Deployment Target: VPS" section is stale — repo confirms hybrid: Next.js app on Vercel, only
  latex-service/resume-parser on Hetzner via `docker-compose.prod.yml`.
- feature/feedback-beta (branch off cleanup):
  - [DONE] T1 Currency USD($)→EUR(€) in UI (content.ts, pricing/page.tsx, page.tsx JSON-LD)
  - [DONE] T2 UpgradeModal → "Payments not active yet" beta notice, CTA to /feedback
  - [DONE] T3 /feedback page (Clerk-protected, Supabase insert, already-submitted guard)
  - [DONE] T4 Resend: replace Youform link with https://joben.eu/feedback
  - [DONE] T5 Admin — skipped by design (feedback viewed in Supabase)
  - NOTE (stale, corrected 2026-07-11): `npx supabase migration list` confirms both
    `20260705120000_add_feedback_table.sql` and `20260421000000_add_resume_analyses_table.sql`
    are already applied on the linked remote project (ResumeAIMax) — Local/Remote match for
    all 12 migrations. No action needed.
- [DONE] 2026-07-11 error audit + fixes (tsc/lint clean, CI green, prod deploy verified up to date via Vercel API):
  - `src/components/dashboard/RecentDocuments.tsx`: pinned `toLocaleDateString('en-US')` — SSR used server
    locale, client used browser locale, causing the still-open dashboard hydration error (JAVASCRIPT-NEXTJS-5,
    4 users, mobile Safari en-GB) that the prior `fd297fd` hydration fix (WeeklyGoals streak) didn't cover.
  - `src/lib/api-response.ts` `fetchOwnedRow()`: downgraded the expected "not found / not owned" `.single()`
    case from `logger.error` to `logger.warn`, so it stops forwarding to Sentry as a real error
    (`logger.ts`'s `Sentry.captureMessage` on every `error`-level log was turning legitimate 404s into noise —
    this was JAVASCRIPT-NEXTJS-M).
  - Several other Sentry "unresolved" issues (E, 4, 7, 8, G, 1/2/3, 9/A, 6) were confirmed already fixed by
    earlier refactors (PDF parsing moved off pdfjs-dist to the external Hetzner service; JSON.parse wrapped
    in try/catch for upstream parser errors; heroContent no longer a string with `.replace()`) or are dev/
    browser-extension noise (Firefox reader mode, Clerk live keys on localhost) — need manual Resolved/Ignored
    in the Sentry dashboard, no code change.
  - `src/app/api/resumes/export-latex/route.ts`: fixed bold/italic/underline text in builder losing the
    space on both sides in the exported PDF (e.g. "coordinateda team of 7to build"). Root cause: `escapeLatex()`
    calls `normalizeLatexText()` which `.trim()`s — and `escapeLatexFormatted()` was calling it per-segment
    via `renderInlineLatex`'s escape callback, so the space at each text/bold boundary got trimmed away
    independently on both sides. Fixed by normalizing the whole string once before tokenizing, and extracting
    a `escapeLatexChars()` (char-escaping only, no trim) used for per-segment escaping. Verified with a
    standalone repro script against old vs. new logic. Not a Hetzner/LaTeX-service issue — pure Next.js bug.
- [DONE] Project parsing fix: Python parser now extracts inline `role` + period from project description prefixes (e.g. "Solo Founder Jan 2024 - Present ..."), prevents hallucinated 1950 placeholder years, emits `role` + `bullets` fields, and prioritises literal dates over hallucinated explicit fields. `pdf-import.ts`, `ResumeBuilder` projects state, Harvard template, and LaTeX export all consume the new fields and render projects with role/period header + clean per-line bullets. Education builder panels now force the canonical "Education" label so legacy garbage titles never leak into the preview/PDF. Tests: 27 Python + 59 TS pass; `tsc --noEmit`, `npm run lint`, `npm run build` all green.
- [DONE] Replaced navbar "J" badge with jobeneu logo and set favicon to `jobeneu_logo.jpg`
- [DONE] Updated Free plan limits across UI + Upstash/Redis (15 bullets, 3 cover letters, 3 tailoring, 5 exports) and added subtle watermark on Free PDF exports
- [DONE] Enriched resume-parser: LinkedIn/GitHub/website/location extraction, 200+ section name mappings (EN+RO), extended bullet chars, company suffix detection, 5 new section types (languages/volunteer/interestories, 3 tailoring, 5 exports) and added subtle watermark on Free PDF exports
- [DONE] Enriched resume-parser: LinkedIn/GitHub/website/location extraction, 200+ section name mappings (EN+RO), extended bullet chars, company suffix detection, 5 new section types (languages/volunteer/interests/references/associations), 25 tests passing
- [DONE] Remove unsubstantiated marketing claims from UI copy
- [DONE] Parser cleanup: imports, types, formatting, verification
- [DONE] Final launch execution gates (Vercel deploy + service keys)
- [DONE] Deep cleanup FAZA 0: add svix as direct dependency
- [DONE] Deep cleanup FAZA 1: dead code removal (knip/depcheck) on branch `cleanup`
- [DONE] Deep cleanup FAZA 2: deduplication (resend.ts, cron routes, CRUD routes, apply-fix/auto-fix) - 4 commits
- [DONE] Deep cleanup FAZA 3: API consistency audit (report only, findings below)
- [DONE] Deep cleanup FAZA 3 fix: Zod validation + Upstash rate limiting (20/hour) on resumes/export-latex and resumes POST
- [DONE] Deep cleanup FAZA 4: operational cleanup audit — console.log: none in src/ (already clean); console.error: 7 sites audited, none have Sentry.captureException at the same catch site, all kept (src/lib/logger.ts:46, src/lib/anthropic-with-limits.ts:236, src/lib/ratelimit.ts:497, src/app/api/health/route.ts:160, src/app/error.tsx:12, src/app/resumes/page.tsx:62/64); TODO/FIXME: none in src/; env vars: 32 referenced in code (5 hard-required via src/lib/env.ts, rest optional/feature-gated) - see chat history for full list to diff against Vercel
- [DONE] 2026-08-14 post-monetizare: recreated .env.prod.example (was referenced by CLAUDE.md but missing from repo) as part of the Stripe live-payments work below.
- [ ] post-monetizare: unify API error-response shapes (4 concurrent conventions found: jsonWithRequestId, apiError/apiSuccess, raw NextResponse on 429 branches in parse/cover-letter-pdf/redeem-code, health/route.ts manual reimplementation)
- [ ] post-monetizare: add Zod validation for hand-parsed query params (admin/rate-limit GET, auto-fix dryRun, cron parseCronOptions)
- [ ] post-monetizare: decide fate of pdfjs-dist dependency (still referenced by root Dockerfile:44 COPY for standard_fonts, but PDF parsing moved to external Hetzner service)
- [IN PROGRESS] Bullet AI draft flow (generate, regenerate, accept) with explicit credit usage messaging
- [IN PROGRESS] Parser + builder: projects bullets/dates, LinkedIn/GitHub parsing
- [DONE] Final technical polish pass (types, errors, loading, empty states, logs, env, API response shape, mobile, lint)
- [DONE] [Polish C1] TypeScript: npx tsc --noEmit clean, no any introduced
- [DONE] [Polish C2] Error handling: API routes and server actions return safe errors
- [DONE] [Polish C3] Loading states: async action buttons guarded against double-submit
- [DONE] [Polish C4] Empty states: lists/data views never render blank screen
- [DONE] [Polish C5] Console logs: remove debug console.log statements
- [DONE] [Polish C6] Env vars: sync all used vars into .env.prod.example
- [DONE] [Polish C7] API response consistency: success/data and success/error envelope
- [DONE] [Polish C8] Mobile responsiveness: 375px overflow/layout fixes
- [DONE] [Polish C9] Lint: npm run lint clean (warnings/errors)
- [DONE] [Polish C10] Final verification: npx tsc --noEmit final pass
- [DONE] Remove broken score history characters from AI review cards
- [ ] Apply supabase migration: 20260421000000_add_resume_analyses_table.sql (run `npx supabase db push` or apply in Supabase dashboard)
- [DONE] Live AI Auto-Fix + Apply this fix: /api/apply-fix and /api/auto-fix routes with Claude, per-improvement loading states, builder banner + highlight
- [DONE] Before/After modal in builder showing every change made by auto-fix/apply-fix (Before red / After green), sessionStorage bridge from review page
- [DONE] Re-review support: all resumes show Re-review button; score evolution displayed as chain (72 → 85 → 91) when multiple reviews exist
- [DONE] English-only UI: translated AILoadingState, anthropic-with-limits rate-limit errors, and builder banner strings
- [DONE] No-duplicate bullets: server-side isDuplicateOf() validation in apply-fix and auto-fix + English-only AI prompt instructions
- [ ] Connect repo to Vercel (vercel.com/new), set all env vars in Vercel Dashboard
- [ ] Add GitHub Actions secrets: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID + NEXT_PUBLIC_* vars
- [ ] Deploy LaTeX service Docker container (VPS/Railway/Fly.io), set LATEX_SERVICE_URL in Vercel env
- [ ] Configure Clerk webhook: add production endpoint https://yourapp.vercel.app/api/webhooks/clerk
- [ ] Configure Stripe webhook: add production endpoint https://yourapp.vercel.app/api/webhooks/stripe
- [ ] Execute smoke flow (auth -> create -> analyze -> export -> checkout -> verify billing)

## Definition of Done (DoD)
- [x] Code implemented and manually sanity-checked on affected flow
- [x] npx tsc --noEmit passes
- [x] npm run lint passes (errors = 0)
- [x] npm run build passes
- [x] TODO status updated (Active -> Done)

- [DONE] Simplified PDF parsing: removed Python microservice dependency; server-side parsing now uses parse-pdf-server (TypeScript + pdfjs-dist)

- [DONE] Simplified PDF parsing: removed Python microservice dependency; server-side parsing now uses parse-pdf-server (TypeScript + pdfjs-dist)

## Phase Backlog
- [x] Phase 3 P0 (Owner: Platform): add test runner (Vitest) and npm test script
- [x] Phase 3 P0 (Owner: Platform): add parser tests for multilingual resume extraction
- [x] Phase 3 P1 (Owner: Platform): add API smoke tests for critical routes (analyze, tailor, improve-bullet, webhooks)
- [x] Phase 4 P0 (Owner: Platform): introduce structured logger utility and migrate critical server paths
- [x] Phase 4 P1 (Owner: Platform): add request correlation id support in critical API routes
- [x] Phase 5 P1 (Owner: Product): add dashboard email tracking page using email_events
- [x] Phase 5 P1 (Owner: Product): add AI review trend/comparison for same resume on review details
- [x] Phase 5 P2 (Owner: Product): add basic funnel instrumentation (create -> analyze -> improve -> export -> upgrade)
- [x] Phase 6 P0 (Owner: Platform): expand README with local setup (including Supabase local)
- [x] Phase 6 P0 (Owner: Platform): add RUNBOOK with cron/health/webhook/incident response/rollback
- [x] Phase 6 P1 (Owner: Platform): add troubleshooting section for optional integrations/env



## Done

- [DONE] Email automation flows (first resume, inactivity 3d, rate limit)
- [DONE] Harden LaTeX exporter wrapping/truncation (soft breaks for long tokens, xurl, and safer content limits)
- [DONE] Fix Education behavior: hide editable education section titles in builder and render a single Education heading in Harvard preview
- [DONE] Fix Vercel build type error in ResumeBuilder (removed unsupported sectionType prop)

- [DONE] Auto-fix token precheck + warning modal
- [DONE] Align AI feature limits + per-CV PDF import cap
- [DONE] Final check: smoke checklist + free plan cost estimate
- [DONE] Final check summary (business logic, rate limits, free usage cost)

- [DONE] Added client-side bullet migration split for legacy single-bullet experience entries so existing resumes display multiple bullets immediately
- [DONE] Resume parser now returns structured work_experience bullets and import mapping preserves multiple bullets per role
- [DONE] World-class parser hardening: strict LlamaParse prompt, intelligent date-range recovery from raw text, and production deploy validation on Hetzner
- [DONE] Fixed false 429 rate-limit path by preventing plan drift in Anthropic limiter status checks
- [DONE] Fixed Hetzner parser deployment drift, improved projects extraction fallback, and mapped month-aware experience dates in Resume Builder import
- [DONE] Fixed onboarding CV import to persist parsed projects into Resume Builder Projects tab state
- [DONE] Resume parser now has a raw-text fallback extractor for projects when LlamaParse JSON misses them
- [DONE] Resume builder Projects tab now has a dedicated project editor with add/delete and field editing, separate from custom sections
- [DONE] Resume parser projects: first-class projects array, improved LlamaParse prompt, project detection heuristics, comprehensive tests, and documentation
- [DONE] Fix resume parser projects section routing on Hetzner parser service
- [DONE] Add LinkedIn and GitHub support in resume builder profile/header

- [DONE] Implement PDF upload limits and warning modals for ResumeOnboardingModal
- [DONE] Replace Python resume parser with Gemini 2.0 Flash-Lite and add PDF import limits per resume
- [DONE] Maximized upload resume parser accuracy (two-column reconstruction, combined role/company/date lines, wrapped bullets, numeric date ranges) + added regression tests
- [DONE] AI Summary generator + independent left panel scroll in resume builder
- [DONE] PostHog setup alignment (Next.js instrumentation-client + session replay + env cleanup)
- [DONE] Enabled unlimited PDF export copy consistency on landing and clarified localhost Clerk live-key domain constraint
- [DONE] Enabled unlimited PDF exports across plans and added Clerk localhost/live-key guard with troubleshooting notes
- [DONE] Rewrote landing pricing and FAQ limits in natural language (CVs, cover letters, tailoring, bullet rewrites)
- [DONE] Aligned manual Redis rate limiting to final spec (free AI access + admin/user payload shape + hard-cap exhaustion + @upstash/ratelimit cleanup)
- [DONE] Implemented manual Redis rate-limiting system (tokens/features/admin controls + route migrations + edge-case tests)
- [DONE] Hardened AI review JSON parsing with robust extraction, fallback repair pass, safe error messaging, and edge-case tests
- [DONE] Fixed redeem-code configuration detection to support legacy env keys and ignore placeholder values (without exposing code)
- [DONE] Updated legal support contact email to admin@joben.eu in Terms and Privacy pages
- [DONE] Added Terms and Conditions + Privacy Policy pages and integrated mandatory legal consent checkbox before sign-up redirect
- [DONE] Hardened AI review fix actions with direct href fallback navigation for Auto-Fix and Apply this fix
- [DONE] Fixed AI review + builder UX blockers (functional AI upload, Apply-fix navigation, import/export responsiveness guards, dynamic dashboard score label, removed General Optimization option)
- [DONE] Hardened LaTeX export layout for long imported content (wrapping subheadings + text normalization/clamping + multiline bullet splitting)
- [DONE] Removed all public redeem-code hints, removed redeem fallback default, and required private env-configured code
- [DONE] Implemented private redeem flow for instant lifetime Recruiting access (DB migration + API + dashboard UI + Stripe webhook protection + tests)
- [DONE] Diagnosed bullet AI prompt/call path and clarified rate-limit vs Anthropic-call behavior in API/UI messaging
- [DONE] Debugged production Clerk auth issue and hardened custom auth routing defaults in app/middleware/env template
- [DONE] Switched deployment to Vercel (removed VPS/Traefik/self-hosted Supabase from docker-compose; added vercel.json with cron config; updated CI/CD workflow)
- [DONE] DB migration `20260419193000_add_users_stripe_last_event_created.sql` applied to Supabase Cloud (ResumeAIMax / vdgjxejunpfxvnpxyazq)
- [DONE] docker-compose.prod.yml reduced to LaTeX service only
- [DONE] Hardened Stripe webhooks with event-order protection (`stripe_last_event_created`) and added subscription/invoice event sync coverage
- [DONE] Extended `/api/health` with Redis and LaTeX probes plus stricter production readiness conditions
- [DONE] Added automated DB backup service and operational resource limits in `docker-compose.prod.yml`
- [DONE] Added automated `followup-cron` scheduler container with configurable cadence/target URL
- [DONE] Added optional alert webhook support in logger (`ALERT_WEBHOOK_URL`, `ALERT_MIN_LEVEL`)
- [DONE] Added migration `20260419193000_add_users_stripe_last_event_created.sql` and updated runbook/env templates
- [DONE] Secured internal PDF compile flow with LATEX_SERVICE_SECRET between app export route and latex-service (plus prod env wiring)
- [DONE] Changed API rate limiting fallback to fail-closed when Upstash Redis is missing or rate limit checks fail
- [DONE] Fixed resume builder sidebar flex+scroll collapse on Experience tab by locking header/footer and using min-h-0 scroll region
- [DONE] Added FAQ section on homepage (below Pricing) with 8 expandable questions
- [DONE] Upgraded @anthropic-ai/sdk to 0.90.0 and added persistent patch-package fix for SDK tsconfig moduleResolution deprecation
- [DONE] Updated Free pricing copy from "1 Word download" to "1 PDF download"
- [DONE] Removed create-resume onboarding modal so /resumes/new opens directly in builder
- [DONE] Removed "or unlimited" from Recruiting pricing card and re-validated Upstash daily+monthly limit wiring
- [DONE] Migrated Anthropic API runtime model to Haiku (`ANTHROPIC_MODEL` override, Haiku default)
- [DONE] Implemented requested limits: Free bullet rewrites teaser only, Pro daily+monthly caps, Recruiting unlimited/high-volume behavior
- [DONE] Updated pricing copy to match new plan limits (Free/Pro/Recruiting)
- [DONE] Resolved local Internal Server Error by clearing stale dev process on port 3000 and restarting clean Next.js runtime
- [DONE] Pricing card polish: removed monthly credits line from Pro card and fixed check/X icon size consistency on wrapped text
- [DONE] Enforced Upstash API monthly limits on AI endpoints (analyze, tailor, improve-bullet, cover-letter) with plan-aware caps
- [DONE] Hardened GOD MODE resolution via Clerk session email hint so admin keeps unlimited plan capabilities even if DB email is stale
- [DONE] Builder desktop layout fixed with stable column widths and non-squeezing preview pane
- [DONE] Added GOD MODE override for duku.constantin@gmail.com with full plan access
- [DONE] Fix Experience tab visual shrink by stabilizing tab width and scrollbar gutter in builder editor
- [DONE] Centralized plan definitions and enforced per-plan quotas (Free: 3 resumes, 1 export) plus AI gating by plan
- [DONE] Full roadmap closure: phases 0-6 implemented with tests, observability, analytics, and operational documentation
- [DONE] UX polish: better sections spacing in builder and keep Harvard as the only resume template
- [DONE] Phase 3 P0: Deploy workflow quality gates + post-deploy health polling
- [DONE] Phase 3 P0: Clear blocking lint errors to enable CI quality gates
- [DONE] Phase 2 P1: Resume list Analyze action with direct AI review creation flow
- [DONE] Phase 1 P0: Idempotent followup-7d cron flow with retry-safe email event locking
- [DONE] Phase 1 P0: Webhook idempotency (Clerk + Stripe) and email event dedup safeguards
- [DONE] Add branded horizontal scroll for sidebar tab row
- [DONE] Improve PDF parsing for education, projects, skills, and certifications sections
- [DONE] Improve PDF experience parsing into separate jobs and bullet points




