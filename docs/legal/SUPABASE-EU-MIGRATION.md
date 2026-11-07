# Runbook: mutarea Supabase în regiune UE

**Stare: EFECTUAT 2026-11-07.** Proiect nou `joben-eu` (ref `lqspalmezsjpuxxsuscy`, AWS eu-central-1 Frankfurt) în organizația "Duku's projects". Schema = cele 32 de migrații rulate în SQL editor (înregistrate în `supabase_migrations.schema_migrations`), datele copiate tabel cu tabel (17 tabele, numere de rânduri identice, inclusiv 48 de utilizatori), variabilele `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` înlocuite în Vercel (Production, Preview, Development) și producția redeploy-ată. Verificat: o scriere de test prin `joben.eu` a ajuns în proiectul EU și nu în cel vechi. Proiectul vechi (`vdgjxejunpfxvnpxyazq`, us-east-1) este păstrat intact ca rollback; pune-l pe pauză după ~7 zile și apoi șterge-l.

Mai jos rămâne planul original, pentru referință.

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
