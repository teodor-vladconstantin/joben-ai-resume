create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_webhook_events_provider_event_id
  on public.webhook_events(provider, event_id);

create index if not exists idx_webhook_events_created_at
  on public.webhook_events(created_at desc);

alter table public.webhook_events enable row level security;

alter table public.email_events
  add column if not exists source_event_id text;

create unique index if not exists idx_email_events_user_type_provider_unique
  on public.email_events(user_clerk_id, email_type, provider_id)
  where provider_id is not null;

create unique index if not exists idx_email_events_user_type_source_event_unique
  on public.email_events(user_clerk_id, email_type, source_event_id)
  where source_event_id is not null;