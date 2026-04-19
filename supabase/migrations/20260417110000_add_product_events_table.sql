create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_clerk_id text not null,
  event_name text not null,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_events_user_clerk_id
  on public.product_events(user_clerk_id);

create index if not exists idx_product_events_event_name
  on public.product_events(event_name);

create index if not exists idx_product_events_created_at
  on public.product_events(created_at desc);

alter table public.product_events enable row level security;
