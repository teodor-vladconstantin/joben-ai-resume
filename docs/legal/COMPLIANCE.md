# Legal compliance notes (Terms, Privacy, Cookies)

Last review: 2026-10-22. Copy lives in `messages/{ro,en}.json` under `Legal.*` and `CookieConsent`.
Not legal advice. Have a Romanian lawyer validate before relying on it.

## Framework applied
- GDPR (EU) 2016/679, Law 190/2018 (age of digital consent 16), Law 506/2004 art. 4(5) cookies and art. 12 commercial email, Directive 2002/58/EC.
- Consumer: GEO 34/2014 (distance contracts, withdrawal 14 days), Directive 2019/770 (digital services conformity), Law 193/2000 + Directive 93/13 (unfair terms), ANPC / SAL (the EU ODR platform closed 2025-07-20).
- AI Act art. 50 transparency (applies from 2026-08-02): users are told results come from an AI system.
- ANSPDCP enforces art. 4(5) actively (2025-2026 fines of 5,000 to 30,000 lei for non-essential cookies without prior consent).
- Digital Omnibus (COM(2025) 837, cookie/GDPR changes) is still a proposal. Re-check before changing anything.

## Code changes made with this refresh
- GTM/GA4 now loads only after consent (`GtmGate`); noscript iframe removed. Consent Mode alone still sent cookieless pings.
- Sentry Replay only after consent (`enableSentryReplay`); client `sendDefaultPii` off.
- Equal-prominence accept/reject buttons, "Cookie settings" footer link, consent expires after 12 months (`cookie-consent.ts`, mirrored in `consent-mode.ts`).
- `jb_atsdid` lifetime 400 -> 30 days. ATS email explainer now discloses the 2 follow-up emails.
- `TOS_VERSION` bumped to 2026-10-22 (`api/signup/consent`).
- `/api/cron/data-retention` + `.github/workflows/data-retention-cron.yml` enforce the windows in `src/lib/data-retention.ts` (policy section 6).

## Open items for the owner
1. Add the `CRON_SECRET` / `PROD_APP_URL` secrets (already used by other workflows) and run the workflow once with `workflow_dispatch`.
2. Verified via PostHog MCP: free plan keeps events 1 year, recordings 30 days (project setting), IPs anonymized, inputs masked. GA4 event-level retention defaults to 2 months (max 14), so the 14-month promise already holds; no change needed.
3. Supabase is in AWS us-east-1 (from supabase/.temp pooler URL), so it is named as a US transfer in Privacy sections 4 and 5. Resend/Upstash regions are still unconfirmed; moving Supabase to an EU region would simplify the transfer story.
4. Stripe Dashboard > Public details: terms URL `https://joben.eu/ro/terms` (needed for Pass checkout).
5. Subscriptions (Pro, Recruiting) have no withdrawal waiver at checkout, so the 14-day right applies with proportional payment (Terms section 7). Pass keeps the waiver; a lawyer should confirm it is valid for a 14-day service.
6. Withdrawal button (Directive 2023/2673, art. 11a CRD, applies 2026-06-19): Romanian transposition not verified. If required, add a "withdraw from contract" function in Settings.
7. `jb_ref` (referral attribution, 30 days) is classed as necessary. A strict reading could require consent; the safe alternative is setting it only after consent.
8. Pricing states "provider is not a VAT payer"; update Terms section 6 if that changes.
9. Social listening (Privacy section 12) stores third-party public posts for 90 days; keep it small or drop it if unused.
