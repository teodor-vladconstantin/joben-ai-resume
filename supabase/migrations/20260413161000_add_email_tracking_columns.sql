alter table if exists public.users
  add column if not exists welcome_sent_at timestamptz,
  add column if not exists followup_sent_at timestamptz;
