## Plan: Roadmap Faze + TODO pentru Joben Resume

## Status Update (2026-04-19)

### Livrat azi
- Kickoff implementare hardening de launch: activata executia pe blocker-ele P0 (rate limiting fail-close + securizare latex service cu auth intern).
- P0 rate limiting hardening finalizat: fallback-ul pe indisponibilitate Upstash este acum fail-closed (request blocat cu status 503), nu fail-open.
- P0 PDF export hardening finalizat: app-ul trimite auth intern catre latex-service, iar latex-service valideaza secretul in productie; wiring completat in `docker-compose.prod.yml` si `.env.prod.example`.
- Stripe webhooks hardening finalizat: adaugata protectie de ordering/replay cu `users.stripe_last_event_created`, plus coverage pentru `customer.subscription.created` si `invoice.paid`.
- Health endpoint hardening finalizat: `/api/health` verifica explicit backend-ul rate limiting (Upstash) si latex-service (inclusiv auth intern) cu reguli mai stricte in productie.
- Operare productie hardening finalizata in repo: adaugat serviciu automat de backup DB, limite de resurse container, scheduler `followup-cron`, plus alerta optionala pe webhook in logger.
- Migrare noua adaugata: `20260419193000_add_users_stripe_last_event_created.sql`.
- Fix permanent pentru layoutul de scroll din builder: in tab-ul Experience nu se mai comprima ("scunda") zona de tabs/header/footer cand creste continutul; sidebar-ul foloseste acum min-h-0 corect pe zona scrollabila si shrink-0 pe sectiunile fixe.
- Landing page FAQ integrat sub sectiunea Pricing, cu 8 intrebari/raspunsuri in accordion.
- Model Claude actualizat pe Haiku pentru cost mai mic in runtime API (`ANTHROPIC_MODEL` cu fallback Haiku).
- Noile limite au fost implementate pe doua ferestre (zilnic + lunar) in Upstash.
- Pricing aliniat: Pro la 12 USD/luna cu limite explicite in card.
- Free permite doar teaser AI pe bullet rewrites (2/zi, 30/luna), fara cover letter si fara resume analysis.
- Recruiting ramane cu limite foarte mari / nelimitat pentru fluxuri high-volume.
- Copy cleanup: eliminat textul "or unlimited" din cardul Recruiting; afisajul ramane "Higher AI limits".
- Audit Upstash confirmat: chei separate per period+route+user (`daily|monthly:route:userId`) si verificare pe ambele ferestre pentru Pro/Free.
- UX flow simplificat: modalul de onboarding din `/resumes/new` a fost eliminat; utilizatorul intra direct in editorul de resume.
- Pricing wording corectat pe Free plan: "3 resumes with 1 PDF download" (in loc de Word).
- Anthropic SDK maintenance: upgrade la `@anthropic-ai/sdk@0.90.0` plus patch persistent (`patch-package`) pentru tsconfig-ul intern al SDK-ului, evitand editari manuale volatile in node_modules.
- Incident local rezolvat: Internal Server Error pe localhost:3000 era cauzat de un proces dev stale pe portul 3000; procesul a fost oprit si serverul Next a fost repornit curat pe 3000.

### Limite AI active
- analyze: free blocat, pro 5/zi si 30/luna, recruiting nelimitat
- tailor: free blocat, pro 5/zi si 30/luna, recruiting nelimitat
- improve-bullet: free 2/zi si 30/luna, pro 10/zi si 150/luna, recruiting nelimitat
- cover-letter: free blocat, pro 3/zi si 20/luna, recruiting nelimitat

### Validare
- `npx tsc --noEmit` - pass
- `npm run lint` - pass
- `npm run test` - pass (12/12)
- `npm run build` - pass
- `docker compose -f docker-compose.prod.yml --env-file .env.prod.example config` - pass (cu `.env.prod` temporar din template)

### Ramane pentru inchidere completa azi (executie infra/deploy)
- Provisionare `.env.prod` real pe VPS + actualizare secrets in GitHub Actions.
- Aplicare migrare noua pe baza tinta.
- Rulare smoke gate pe staging si apoi deploy productie + hypercare.

## Status Update (2026-04-18)

### Livrat azi
- GOD MODE hardening pentru admin: rezolvarea planului accepta acum email hint din Clerk session claims, nu doar email din tabela users. Astfel duku.constantin@gmail.com primeste consistent plan Recruiting (capabilitati nelimitate).
- Control cost AI cu Upstash: adaugat limiter centralizat pe endpoint-uri scumpe (`/api/analyze`, `/api/tailor`, `/api/improve-bullet`, `/api/cover-letter`) prin sliding window zilnic, cu limite per plan.
- Plan-aware behavior: `recruiting` ramane nelimitat pentru a nu bloca adminul; `pro` si `free` au cap-uri explicite pe endpoint.
- Rutele de create/export resume folosesc acum acelasi email hint pentru rezolvare plan, astfel GOD MODE ramane stabil inclusiv pe export-uri.

### Limite AI active (per 1 zi)
- analyze: free 3, pro 40, recruiting nelimitat
- tailor: free 3, pro 60, recruiting nelimitat
- improve-bullet: free 5, pro 250, recruiting nelimitat
- cover-letter: free 2, pro 40, recruiting nelimitat

### Validare
- `npx tsc --noEmit` - pass
- `npm run lint` - pass
- `npm run test` - pass (12/12)
- `npm run build` - pass

## Status Update (2026-04-17)

### Completat pana acum
- Planuri centralizate + enforcement per user: definitii unice Free/Pro/Recruiting in layer comun, default Free pentru utilizatori noi, gating AI pe plan si quota enforcement (Free: max 3 resumes, max 1 export PDF), plus semnalizare upgrade in UI la depasirea limitelor.
- Faza 1 (stabilizare backend critic): implementata idempotency pentru webhook Clerk si Stripe prin event claiming, extins Stripe webhook coverage (customer.subscription.updated, invoice.payment_failed, charge.refunded), adaugata migrare pentru webhook_events + dedup email events, cron followup-7d facut retry-safe si idempotent.
- Faza 2 (flow-uri produs): adaugat flow direct Resume -> Analyze in lista de CV-uri, integrarea Improve Bullet exista si functioneaza pe nivel de bullet, create mode pentru rutele /resumes/new si /cover-letters/new este tratat corect, export PDF pentru cover letters este disponibil.
- Faza 3 (calitate / safety net): reparate erorile de lint blocante, adaugate quality gates in pipeline (lint + typecheck + build in workflow deploy), introdus Vitest + suite automate (parser multilingual, critical routes, CRUD smoke).
- Faza 4 (operare): adaugat health polling post-deploy cu fail-fast in workflow, introdus logger structurat si request-id correlation pe endpoint-uri critice.
- Faza 5 (analytics produs): adaugat dashboard nou de email/funnel analytics, trend AI review pe dashboard, comparatie review curent vs review anterior pe acelasi CV, plus instrumentare funnel in create/analyze/improve/export/checkout.
- Faza 6 (documentatie): README extins cu setup local complet (inclusiv Supabase local), troubleshooting pentru integrari optionale, RUNBOOK operational complet (cron, health, webhooks, incident response, rollback).
- UX recent: imbunatatita spatierea in builder sections + template-urile reduse la Harvard only.

### Ramas de finalizat pentru inchidere completa
- Toate fazele din roadmap au fost implementate (0-6).
- Urmatorul pas este exclusiv monitorizare post-release (stabilitate webhook-uri, calitate livrare email, conversie funnel, impact noilor limite de plan).

Aplicatia este la nivel bun de MVP (auth, builder, AI review, billing, cron, migrari), dar are risc operational in backend (webhooks, billing sync), lipsa testare automata, si cateva gap-uri de flow produs. Recomand o executie in 6 faze: mai intai stabilitate si siguranta monetizare, apoi inchidere flow UX, apoi calitate/observabilitate, iar la final extensii de produs.

**Steps**
1. Faza 0 - Baseline si guvernanta de executie (1-2 zile, blocheaza fazele urmatoare):
   TODO: actualizeaza TODO.md cu sectiuni pe faze; muta itemele existente in faza corecta; defineste criterii DoD per task (cod, lint, typecheck, build, verificare manuala); defineste prioritizare P0/P1/P2 si owner per task.
2. Faza 1 - Stabilizare backend critic (Sprint 1, prioritate P0):
   TODO: adauga idempotency pentru webhook-urile Clerk si Stripe pe event id; acopera in Stripe webhook evenimentele customer.subscription.updated, invoice.payment_failed, charge.refunded; previne duplicate email events prin constrangere de unicitate sau cheie de dedup; revizuieste fluxul welcome/followup pentru retry fara dubluri; valideaza schema dupa eliminarea experiences table si confirma ca nu mai exista referinte runtime.
3. Faza 2 - Inchidere flow-uri produs end-to-end (Sprint 1-2, paralel partial cu Faza 1):
   TODO: adauga CTA Analyze This Resume din lista/detaliu CV; conecteaza Improve Bullet API in UI Resume Builder (la nivel de bullet); defineste comportament clar pentru create/edit mode la rutele /resumes/new si /cover-letters/new; adauga export PDF pentru cover letters (sau marcheaza explicit out of scope pentru aceasta iteratie); adauga mesaje clare pentru limite free tier in UI.
4. Faza 3 - Calitate engineering si safety net (Sprint 2, depinde de Faza 1 pentru endpoint-uri stabile):
   TODO: introdu test runner (Vitest sau Jest) + setup de baza; acopera cu teste parserul PDF multilingv si maparea sectiunilor; adauga teste API pentru analyze, tailor, improve-bullet, webhook-uri; adauga smoke tests pentru CRUD resumes/cover letters; adauga gate in CI pentru lint + typecheck + build (+ test dupa ce devine stabil).
5. Faza 4 - Observabilitate si operare productie (Sprint 2-3, paralel cu Faza 3):
   TODO: inlocuieste console.error cu logger structurat reutilizabil; adauga corelare request id pentru endpoint-uri critice; conecteaza health endpoint in deploy workflow cu polling si fail-fast daca aplicatia nu devine healthy; defineste alerting minim pentru erori webhook, esec Stripe sync, esec cron followup; documenteaza procedura de rollback la deploy.
6. Faza 5 - Product analytics si iteratii de crestere (Sprint 3, depinde de fazele 1-4):
   TODO: livreaza dashboard pentru email tracking (sent/open/click/fail) pe baza email_events; adauga trend/comparatie intre AI reviews pentru acelasi CV; adauga instrumentare funnel (create CV -> analyze -> improve -> export -> upgrade); prioritizeaza urmatorul pachet de feature-uri pe date reale, nu pe intuitie.
7. Faza 6 - Documentatie si onboarding executabil (continuu, inchidere la final de sprint):
   TODO: extinde README cu setup complet local (inclusiv Supabase local); adauga runbook operational (cron, health, webhooks, incident response); actualizeaza ghidul de env si troubleshooting pentru servicii optionale; mentine TODO.md sincronizat zilnic ca single source of truth.

**Relevant files**
- f:/joben-resume/TODO.md - sursa de adevar pentru executie pe faze si status
- f:/joben-resume/src/app/api/webhooks/clerk/route.ts - idempotency si siguranta sync user
- f:/joben-resume/src/app/api/webhooks/stripe/route.ts - acoperire completa evenimente billing
- f:/joben-resume/src/app/api/cron/followup-7d/route.ts - retry/idempotency pentru followup emails
- f:/joben-resume/src/lib/env.ts - validare env critic vs optional
- f:/joben-resume/src/lib/upstash.ts - strategie rate limit per plan
- f:/joben-resume/src/components/builder/ResumeBuilder.tsx - integrare Improve Bullet in UI
- f:/joben-resume/src/app/resumes/page.tsx - CTA Analyze This Resume
- f:/joben-resume/src/app/ai-review/page.tsx - workflow review list/detail
- f:/joben-resume/src/components/cover-letter/CoverLetterBuilder.tsx - export si polish UX
- f:/joben-resume/supabase/migrations/20260412220150_init_core_schema.sql - schema de baza + RLS
- f:/joben-resume/supabase/migrations/20260416000000_drop_experiences_table.sql - verificare efecte secundare schema
- f:/joben-resume/.github/workflows/deploy.yml - gates CI/CD si health validation post deploy
- f:/joben-resume/package.json - scripturi de calitate (lint, build, test)

**Verification**
1. Dupa fiecare task major: ruleaza npx tsc --noEmit, npm run lint, npm run build.
2. Dupa introducerea test runner: ruleaza npm run test in CI la fiecare push pe main.
3. Verificari manuale obligatorii pe fluxuri: sign-up -> create resume -> analyze -> improve bullet -> export -> checkout pro.
4. Simuleaza webhook replay pentru Clerk si Stripe si confirma ca nu apar duplicate in DB.
5. Ruleaza cron followup in dry-run si live mode, apoi confirma evenimentele in email_events fara duplicate.
6. Verifica deploy pipeline pe mediu de staging cu health polling activ si fail condition testata.

**Decisions**
- Inclus: stabilitate backend, inchidere flow-uri produs, calitate, observabilitate, operare, analytics de baza.
- Excluded momentan: redesign major UI, colaborare multi-user in timp real, refactor arhitectural complet al builder-ului.
- Prioritate recomandata: P0 monetizare + corectitudine date > P1 UX flow completion > P2 extensii growth.
- Assumption: obiectivul urmatoarelor sprinturi este productie robusta si crestere controlata, nu doar adaugare rapida de feature-uri.

**Further Considerations**
1. Metrici sprint: seteaza 3 KPI minim (deploy success rate, webhook failure rate, conversion free->pro).
2. Cadenta planificare: revizuire saptamanala a TODO.md + reprioritizare pe baza metricilor.
3. Control scope: orice task nou intra in backlog doar cu impact estimat (business + risc tehnic).