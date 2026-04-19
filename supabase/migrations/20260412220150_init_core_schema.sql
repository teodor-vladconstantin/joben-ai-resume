create extension if not exists pgcrypto;

create table if not exists public.users (
	id uuid primary key default gen_random_uuid(),
	clerk_id text unique not null,
	email text,
	first_name text,
	last_name text,
	avatar_url text,
	plan text not null default 'free',
	stripe_customer_id text,
	stripe_subscription_id text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.resumes (
	id uuid primary key default gen_random_uuid(),
	user_id text not null,
	title text not null default 'Untitled Resume',
	score integer not null default 0,
	data jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
	id uuid primary key default gen_random_uuid(),
	resume_id uuid not null references public.resumes(id) on delete cascade,
	title text not null,
	company text,
	start_date date,
	end_date date,
	description text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.cover_letters (
	id uuid primary key default gen_random_uuid(),
	user_id text not null,
	title text not null default 'Untitled Cover Letter',
	content text not null default '',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.ai_reviews (
	id uuid primary key default gen_random_uuid(),
	user_id text not null,
	resume_id uuid references public.resumes(id) on delete set null,
	score integer not null default 0,
	feedback jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_resumes_user_id on public.resumes(user_id);
create index if not exists idx_cover_letters_user_id on public.cover_letters(user_id);
create index if not exists idx_ai_reviews_user_id on public.ai_reviews(user_id);
create index if not exists idx_experiences_resume_id on public.experiences(resume_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_resumes_updated_at on public.resumes;
create trigger trg_resumes_updated_at
before update on public.resumes
for each row execute function public.set_updated_at();

drop trigger if exists trg_experiences_updated_at on public.experiences;
create trigger trg_experiences_updated_at
before update on public.experiences
for each row execute function public.set_updated_at();

drop trigger if exists trg_cover_letters_updated_at on public.cover_letters;
create trigger trg_cover_letters_updated_at
before update on public.cover_letters
for each row execute function public.set_updated_at();

drop trigger if exists trg_ai_reviews_updated_at on public.ai_reviews;
create trigger trg_ai_reviews_updated_at
before update on public.ai_reviews
for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.resumes enable row level security;
alter table public.experiences enable row level security;
alter table public.cover_letters enable row level security;
alter table public.ai_reviews enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select
using (clerk_id = (auth.jwt() ->> 'sub'));

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update
using (clerk_id = (auth.jwt() ->> 'sub'));

drop policy if exists resumes_rw_own on public.resumes;
create policy resumes_rw_own on public.resumes
for all
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists cover_letters_rw_own on public.cover_letters;
create policy cover_letters_rw_own on public.cover_letters
for all
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists ai_reviews_rw_own on public.ai_reviews;
create policy ai_reviews_rw_own on public.ai_reviews
for all
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

drop policy if exists experiences_rw_via_resume_owner on public.experiences;
create policy experiences_rw_via_resume_owner on public.experiences
for all
using (
	exists (
		select 1
		from public.resumes r
		where r.id = experiences.resume_id
			and r.user_id = (auth.jwt() ->> 'sub')
	)
)
with check (
	exists (
		select 1
		from public.resumes r
		where r.id = experiences.resume_id
			and r.user_id = (auth.jwt() ->> 'sub')
	)
);
