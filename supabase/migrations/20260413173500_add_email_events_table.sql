create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  user_clerk_id text,
  email text,
  email_type text not null,
  status text not null,
  provider_id text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_events_user_clerk_id on public.email_events(user_clerk_id);
create index if not exists idx_email_events_email_type on public.email_events(email_type);
create index if not exists idx_email_events_created_at on public.email_events(created_at desc);
