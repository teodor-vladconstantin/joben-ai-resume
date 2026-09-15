-- Unsubscribe/suppression list, checked by sendEmail() (src/lib/resend.ts)
-- before every send, for every automated email in the app (welcome, lifecycle
-- follow-ups, anonymous ATS scan nurture, etc.) — none of them had a working
-- opt-out mechanism before this migration.
create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  reason text not null default 'unsubscribe_link',
  created_at timestamptz not null default now()
);

create index if not exists idx_email_suppressions_email on public.email_suppressions(email);

alter table public.email_suppressions enable row level security;
