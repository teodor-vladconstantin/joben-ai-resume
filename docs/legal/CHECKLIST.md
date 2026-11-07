# Checklist conformitate Joben (stare 2026-11-06)

Joben nu este declarat "100% conform". Documentele de mai jos sunt un punct de plecare; validarea finală aparține unui avocat și unui contabil.

## Gata (în cod / repo)
- Audit (AUDIT.md), surse primare (SOURCES.md), ROPA, DPIA light, procedură incident, checklist DPA, încadrare AI Act, întrebări avocat/contabil, runbook Supabase UE.
- Pagini RO/EN: Termeni, Confidențialitate, Cookie-uri, **Rambursări și retragere**, **Subprocesatori**; datele firmei într-un singur loc (`lib/legal/company.ts`).
- Funcția online de retragere `/withdrawal` (OUG 34/2014 art. 11¹), link în footer și Settings, confirmare pe email, dovadă în `withdrawal_requests`, retenție 3 ani.
- Re-acceptarea termenilor la schimbarea `LEGAL_VERSION`, istoric în `legal_acceptances`, declarație 16+ la signup.
- Ștergere cont (inclusiv Redis, istoric acceptări) și export (inclusiv acceptări, retrageri).
- Hash IP cu HMAC (`IP_HASH_SECRET`), Sentry fără body/cookie/headere de autentificare, parser fără nume în loguri.
- Notă AI în rezultatul analizei; link ODR scos din footer (platformă desființată).
- Teste: re-acceptare, scrub Sentry, hashIp, ștergere/export în cascadă, retragere.

## Acțiuni manuale (owner)
1. Aplică migrația `20261106120000_add_legal_acceptances.sql` (rulează întâi `migration-reviewer`).
2. Setează `IP_HASH_SECRET` în Vercel (valoare aleatoare lungă).
3. Semnează/acceptă DPA-urile (DPA-CHECKLIST.md); completează regiunile Resend, Upstash, Oracle și actualizează `/subprocessors` și Politica secț. 5.
4. Confirmă secretele `CRON_SECRET` / `PROD_APP_URL` și rulează workflow-ul de retenție o dată.
5. Stripe Dashboard: URL termeni `https://joben.eu/ro/terms`; verifică textul de renunțare la retragere pentru Pass.
6. Programează avocat (LAWYER-QUESTIONS.md) și contabil (TAX-QUESTIONS.md).
7. Supabase: mutat în UE pe 2026-11-07 (vezi SUPABASE-EU-MIGRATION.md). Proiectul vechi `ResumeAIMax` (us-east-1) rămâne neatins; pune-l pe pauză după ~7 zile de funcționare stabilă. Actualizează și `.env.local` local la valorile proiectului nou.
8. Revizuiește diff-ul `Withdrawal` și cu avocatul înainte de PR merge.

## Adăugat ulterior
- Automatizare: la fiecare schimbare legală (intrare nouă în `LEGAL_CHANGELOG`) toți utilizatorii primesc un email o singură dată și li se cere reacceptarea (docs/legal/LEGAL-CHANGE-PROCESS.md). Migrația `20261107120000_add_legal_notice_deliveries.sql` e aplicată în proiectul EU.
- Anonimizare opțională a contactului (email, telefon, linkuri) înainte de scoring: `AI_REDACT_CONTACT=true` (analyze și ATS checker). Activează după ce compari scorurile pe câteva CV-uri; numele și adresa nu sunt redactate.
- Export PDF în Settings (`/api/account/export?format=pdf`), rezumat lizibil; JSON rămâne copia completă.
- Migrațiile au fost aplicate în producție (inclusiv `legal_acceptances`).

## Deschis (cod)
- Ștergerea persoanei din PostHog la ștergerea contului (necesită cheie API personală).
- Jurnal server-side pentru consimțământul de cookie-uri (M9) și consimțământ separat pentru marketing (M10).
- test automat de izolare între useri (M7); nota AI în scrisori și adaptare la job.
- Coadă de reîncercare pentru ștergerea utilizatorului din Clerk (acum doar logat).
- Verificarea Sentry `sendDefaultPii: true` pe server/edge (cookie-urile sunt acum eliminate).
- Textul OUG 34/2014 pentru plata proporțională și exceptiile de la retragere (numerotare neverificată).
