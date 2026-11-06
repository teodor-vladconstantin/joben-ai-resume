# Audit conformitate GDPR / UE / RO (Faza 0)

Data: 2026-11-06. Doar citire, nimic din cod nu a fost modificat. Nu este aviz juridic; punctele marcate [DE VERIFICAT DE AVOCAT] / [DE VERIFICAT DE CONTABIL] cer specialist.
Punct de plecare: `docs/legal/COMPLIANCE.md` (revizuit 2026-10-22). O mare parte din Fazele 1 si 2 exista deja; acest audit listeaza ce exista si ce lipseste.

## 1. Date personale colectate si destinatie

| Categorie | Ce contine | Unde ajunge | Cod |
|---|---|---|---|
| Cont | email, nume, metoda de login (+ nume/email/poza Google), limba | Clerk (auth), copie in Supabase `users` | `api/webhooks/clerk` |
| Continut CV | nume, telefon, email, adresa, LinkedIn/GitHub, istoric profesional, text liber (pot aparea accidental date sensibile/foto) | Supabase `resumes.data` (JSONB), `resume_analyses`, `ai_reviews`, `cover_letters` | `api/resumes`, `api/analyze` |
| Fisier CV incarcat | PDF/DOCX | parsat pe VPS (Oracle) in `resume-parser-service`, **nu se stocheaza** in Supabase Storage (nu exista `storage.from`). Retentia temporara pe disc VPS: neverificata | `resume-parser-service/main.py` |
| ATS checker fara cont | scor, raport, limba, hash IP, cookie `jb_atsdid`, email optional | Supabase `anonymous_scans` (90 zile daca nerevendicat) | `api/public/ats-check` |
| Plati | customer/subscription id, plan, coduri promo (cardul ramane la Stripe) | Stripe + `users` | `api/webhooks/stripe` |
| Email | adresa, evenimente trimise, suppression list | Resend, `email_events`, `email_suppressions` | `lib/resend.ts` |
| Consimtamant signup | `tos_accepted_at`, `tos_version`, `signup_ip_hash` | `users`, `signup_consents` (token 30 zile) | `api/signup/consent` |
| Analytics (doar cu consimtamant) | evenimente, replay, GA4 prin GTM | PostHog EU, Sentry Replay, Google | `PostHogProvider`, `GtmGate` |
| Erori/loguri | request id, Clerk user id, IP in Sentry | Sentry EU, Vercel logs | `lib/logger.ts` |
| Rate limiting | cheie pe user id / hash IP | Upstash Redis (TTL ore-1 luna) | `lib/ratelimit.ts` |
| Social listening | postari publice ale tertilor | `social_leads` (90 zile) | `lib/social-listening.ts` |
| Referral | cod, legatura invitator-invitat | `referrals` | `lib/referral.ts` |

## 2. Procesatori si transferuri (conform politicii curente + cod)

| Procesator | Rol | Locatie declarata | Mecanism transfer declarat | Status DPA |
|---|---|---|---|---|
| Anthropic | Claude API (CV complet) | SUA | DPF/SCC | de confirmat (vezi 3) |
| Supabase | DB | AWS us-east-1 (din pooler URL) | DPF/SCC | de confirmat |
| Clerk | auth | SUA | DPF/SCC | de confirmat |
| Stripe | plati, si controller propriu | SUA/UE | DPF/SCC | de confirmat |
| Resend | email | SUA (regiune neconfirmata) | SCC | de confirmat |
| Upstash | rate limit | regiune neconfirmata | de stabilit | de confirmat |
| Vercel | hosting, analytics, speed insights | SUA/global | DPF/SCC | de confirmat |
| Oracle Cloud (VPS) | parser CV + PDF | regiune neverificata | de stabilit | de confirmat |
| Sentry | erori, Replay | UE | n/a | de confirmat |
| PostHog | analytics | UE | n/a | de confirmat |
| Google Ireland | GA4 prin GTM | IE + transfer SUA | DPF | de confirmat |

Nu exista o pagina publica cu lista subprocesatorilor (doar lista in Politica sectiunea 4).

## 3. Ce se trimite la Claude

Doua cai, ambele cu date personale:
1. **Next.js** (`analyze`, `auto-fix`, `tailor`, `cover-letter`, `generate-summary`, `improve-bullet`, `public/ats-check`) prin `anthropic-with-limits.ts`. `analyze` trimite tot `resumeText` (pana la 15.000 caractere) fara redactare de contact. `generate-summary` include sectiunea `personal`.
2. **VPS parser** (`resume-parser-service/main.py:1375`, `anthropic_client.messages.stream`) trimite textul CV-ului la extragere. Aceasta cale nu apare explicit in Politica ca flux separat.

Minimizare existenta: `sanitizeForPrompt` (anti prompt-injection, nu anonimizare), Sentry gen_ai cu `recordInputs/Outputs: false`, PostHog AI in privacy mode. Nu exista anonimizare de campuri de contact.

Retentie/antrenare Anthropic (verificat 2026-11-06): API comercial nu foloseste datele la antrenare implicit; stergere din backend in 30 zile; ZDR optional pe endpointuri eligibile; exceptie pentru "Covered Models" (30 zile obligatoriu). Surse: [API and data retention](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention), [privacy.anthropic.com retention](https://privacy.anthropic.com/en/articles/7996866-how-long-do-you-store-personal-data), [Covered Models](https://support.claude.com/en/articles/15425996-data-retention-practices-for-covered-models). Textul contractual (DPA/Commercial Terms) nu a fost citit; modelul folosit azi (`claude-haiku-5-5`) trebuie verificat daca e "covered". Nu exista nicio setare ZDR in cod.

## 4. Retentie, stergere, export

- CV-uri, analize, scrisori: cat timp exista contul; stergere cont la cerere (`lib/account-deletion.ts`); conturi inactive 24 luni cu avertizare 30 zile (`cron/inactive-accounts`).
- Politica retentie automata (`lib/data-retention.ts`): anonymous_scans 90z, signup_consents 30z, email_events/product_events/webhook_events 365z, feedback 730z, social_leads 90z. Rulat din GitHub Actions; **secretele `CRON_SECRET`/`PROD_APP_URL` si prima rulare sunt listate ca actiune deschisa a owner-ului, neconfirmate**.
- Export: `GET /api/account/export`, JSON (nu PDF), 11 surse.
- Stergere in cascada: subscriptie Stripe anulata, 5 tabele + 5 tabele secundare + `anonymous_scans` dupa email, `users`, utilizator Clerk (esec doar logat).

## 5. Ce exista deja (pagini, banner, consimtamant)

- Pagini: `/privacy`, `/terms`, `/cookies` (RO/EN, 14 sectiuni in Politica, lista cookie cu durate), `/contact`, `/about`. Footer cu "Cookie settings".
- Banner: accept/refuz cu aceeasi proeminenta, GTM/GA4/PostHog/Sentry Replay incarcate doar dupa consimtamant, expirare 12 luni, revocabil.
- Signup: acceptare Termeni cu dovada server-side (user, versiune, timestamp, hash IP) prin token `signup_consents` legat in webhook Clerk.
- Checkout: `consent_collection.terms_of_service = required` (Stripe).
- Email: wrapper unic cu link dezabonare, `List-Unsubscribe` one-click, suppression list.
- Varsta 16 ani: doar in Politica sectiunea 10. Existenta unei declaratii/checkbox la signup nu a fost confirmata in UI (de verificat in Faza 2).
- Date firma (CUI 22404824, J2007001135104, sediu, hello@joben.eu) sunt hardcodate in `messages/*.json`, nu in `lib/legal/company.ts`.

## 6. Lacune, ordonate pe risc

### Mare
| # | Lacuna | Efort |
|---|---|---|
| H1 | Fluxul VPS parser -> Claude nu e descris in Politica; VPS (Oracle) are regiune/DPA/retentie fisiere temporare neverificate. [DE VERIFICAT DE AVOCAT] | 0.5 zi doc + verificare |
| H2 | Zero documentatie interna: ROPA, DPIA/decizie, procedura incident 72h, checklist DPA, intrebari avocat/contabil. | 1-2 zile |
| H3 | DPA-uri cu procesatori neconfirmate ca semnate/acceptate (Anthropic, Supabase, Clerk, Stripe, Resend, Upstash, Vercel, Oracle, Sentry, PostHog). Actiune manuala. | 0.5 zi |
| H4 | Drept de retragere: Pro/Recruiting fara renuntare la checkout; "buton de retragere" (Dir. 2023/2673 art. 11a CRD) scos si netranspus verificat; Pass are renuntare cu validitate neconfirmata. [DE VERIFICAT DE AVOCAT] | 1 zi dupa verificare |
| H5 | TVA/facturare: statut non-TVA vs vanzari B2C in UE, OSS, e-Factura nedocumentate. [DE VERIFICAT DE CONTABIL] | 0.5 zi doc |

### Mediu
| # | Lacuna | Efort |
|---|---|---|
| M1 | Supabase in us-east-1: toate CV-urile ies din SEE. Migrare in regiune UE simplifica tot. | 1-3 zile + downtime |
| M2 | Nicio anonimizare a contactului inainte de Claude (nume/telefon/email/adresa nu sunt necesare pentru scor). Optiune propusa: redactare prin placeholdere, reinjectare la afisare. | 2-3 zile + test calitate |
| M3 | Re-acceptare la schimbare versiune: `TOS_VERSION` hardcodat in route, fara comparatie la login/prompt de re-acceptare; fara versiune pe Politica separat de Termeni. | 1-2 zile |
| M4 | Stergere cont incompleta pe terti: PostHog person (identify cu `user.id`), Resend contact/istoric, Upstash chei, client Stripe (se pastreaza pentru contabilitate, dar nedocumentat in procedura); esec Clerk doar logat, fara coada de reincercare. | 1-2 zile |
| M5 | Export doar JSON si fara `email_suppressions`/`signup_consents`/`withdrawal_requests`; politica promite "portabilitate in format structurat" (acoperit), dar nu PDF. | 0.5 zi |
| M6 | Sentry server/edge `sendDefaultPii: true` (IP, headere, cookies) cu `scrubSentryEvent`; eficacitatea scrubbing-ului neverificata, divergent de client (`false`). | 0.5 zi |
| M7 | RLS nu este bariera reala: toate rutele folosesc service role, autorizarea sta in `.eq('user_id')` din cod. Politici exista, dar tabelele `users` etc. se bazeaza pe cod; fara test automat de izolare intre useri. | 1 zi teste |
| M8 | Hash IP = sha256 fara sare, trunchiat la 16 hex: pseudonimizare slaba (spatiu IPv4 enumerabil). Folosit si ca dovada de consimtamant. | 0.5 zi |
| M9 | Dovada consimtamantului cookie doar in `localStorage`, fara jurnal server-side. Pentru ANSPDCP suficient adesea, dar nedemonstrabil ulterior. | 1 zi (optional) |
| M10 | Marketing: nu exista consimtamant de marketing separat in cont/Settings pentru useri (se sprijina pe art. 12(2) Legea 506/2004, "produse similare"). [DE VERIFICAT DE AVOCAT] | 1 zi |
| M11 | AI Act: COMPLIANCE.md afirma art. 50 "se aplica din 2026-08-02"; data si pachetul Digital Omnibus trebuie reverificate. Mentiunea de transparenta in UI nu a fost auditata. | 1 zi (Faza 3) |

### Mic
| # | Lacuna | Efort |
|---|---|---|
| L1 | Parserul logheaza `file.filename` (adesea contine numele persoanei) si `entry_name` (companii/proiecte) la INFO. | 0.25 zi |
| L2 | Nu exista pagina dedicata de subprocesatori (doar lista in Politica); nu am verificat prezenta linkurilor ANPC/SAL in footer/pagina comerciant. | 0.5 zi |
| L3 | Date firma neintr-un singur loc (`lib/legal/company.ts`), duplicate in traduceri. | 0.25 zi |
| L4 | `migrations/feedback.sql` in afara `supabase/migrations/` (risc de schema divergenta). | 0.1 zi |
| L5 | Doua adrese de contact (`privacy@` si `hello@`) fara regula explicita pentru cereri DSAR; termenul intern de raspuns e doar cel legal (o luna). | 0.1 zi |
| L6 | Nu am auditat: `mobile-handoff`, `webhooks/social-listening` (date terti), `admin/*`, ce campuri trimite PostHog la `identify`. | 0.5 zi |

## 7. Neverificat in acest audit (si de ce)
Contul Supabase/Vercel/Stripe/Clerk (nu am acces la dashboarduri), regiunile Resend/Upstash/Oracle, textele contractuale DPA, UI-ul concret al signup-ului (checkbox varsta), continutul real al Sentry `scrubSentryEvent`. Legislatia citata in COMPLIANCE.md (Legea 190/2018 prag 16 ani, GEO 34/2014, Legea 506/2004) nu a fost reverificata azi; se face in Faza 1 cu surse in `SOURCES.md`.
