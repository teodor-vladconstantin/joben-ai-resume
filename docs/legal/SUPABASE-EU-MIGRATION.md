# Runbook: mutarea Supabase în regiune UE

Motiv: proiectul actual este în AWS us-east-1; toate CV-urile ies din SEE. O regiune UE (ex. eu-central-1 Frankfurt) simplifică transferurile. Regiunea unui proiect Supabase nu se schimbă pe loc: se creează un proiect nou și se migrează datele. Nu am acces la dashboard; pașii sunt pentru owner. Notă din memoria proiectului: redenumește `.env.local` înainte de comenzi `supabase` și nu folosi `--debug`.

## Pregătire
1. Creează proiect nou în eu-central-1 (același plan). Notează `NEXT_PUBLIC_SUPABASE_URL`, anon key, service role key, parola DB.
2. Aplică toate migrațiile pe proiectul nou: `npx supabase link --project-ref <nou>` apoi `npx supabase db push` (include `20261106120000_add_legal_acceptances.sql`).
3. Verifică RLS: toate tabelele au `enable row level security` (vezi AUDIT.md).

## Fereastra de migrare (anunță 24h înainte, trafic mic)
1. Pune aplicația în mod mentenanță (sau redu scrierile) pentru 15-30 min.
2. Exportă datele: `pg_dump --data-only --no-owner` din proiectul vechi (schema `public`).
3. Importă în proiectul nou: `psql`/`pg_restore`. Verifică numărul de rânduri pe fiecare tabel (`users`, `resumes`, `resume_analyses`, `ai_reviews`, `cover_letters`, `email_events`, `product_events`, `anonymous_scans`, `referrals`, `email_suppressions`, `signup_consents`, `withdrawal_requests`, `legal_acceptances`, `feedback`, `webhook_events`, `social_leads`).
4. În Vercel actualizează cele 3 variabile Supabase și redeploy.
5. Smoke test: sign-in, deschide un CV, rulează o analiză, export date, webhook Clerk de test, cron de retenție cu `workflow_dispatch`.
6. Păstrează proiectul vechi 7 zile (doar citire), apoi șterge-l; actualizează Politica (secț. 4 și 5, pagina /subprocessors: "AWS, regiunea eu-central-1 (Germania)") și `LEGAL_VERSION`.

## Rollback
Reia variabilele vechi în Vercel și redeploy; datele scrise în fereastra nouă trebuie reconciliate manual.
