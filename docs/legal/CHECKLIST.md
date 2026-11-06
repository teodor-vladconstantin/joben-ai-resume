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
7. Decide mutarea Supabase în UE (SUPABASE-EU-MIGRATION.md).
8. Revizuiește diff-ul `Withdrawal` și cu avocatul înainte de PR merge.

## Deschis (cod)
- Anonimizare opțională a câmpurilor de contact înainte de Claude (M2), sub feature flag, cu test de calitate.
- Ștergerea persoanei din PostHog la ștergerea contului (necesită cheie API personală).
- Jurnal server-side pentru consimțământul de cookie-uri (M9) și consimțământ separat pentru marketing (M10).
- Export PDF (acum JSON); test automat de izolare între useri (M7); nota AI în scrisori și adaptare la job.
- Coadă de reîncercare pentru ștergerea utilizatorului din Clerk (acum doar logat).
- Verificarea Sentry `sendDefaultPii: true` pe server/edge (cookie-urile sunt acum eliminate).
- Textul OUG 34/2014 pentru plata proporțională și exceptiile de la retragere (numerotare neverificată).
