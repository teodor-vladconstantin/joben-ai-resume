-- inactivity-3d previously deduped by checking for ANY email_events row of
-- type 'inactivity_3d' regardless of status, so a single failed/skipped/stuck
-- 'processing' row permanently excluded a user from ever receiving the email.
-- followup_sent_at already solved this correctly for followup-7d (a column
-- set only on confirmed success); mirror that pattern here.
alter table if exists public.users
  add column if not exists inactivity_email_sent_at timestamptz;
