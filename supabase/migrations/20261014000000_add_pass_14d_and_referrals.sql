-- Migration: Add pro_expires_at for 14-Day Interview Pass and Referral tracking
-- Date: 2026-10-14

-- 1. Pass 14 Zile expiration column on users
alter table public.users
add column if not exists pro_expires_at timestamptz default null;

-- 2. Referral program columns on users
alter table public.users
add column if not exists referral_code text unique default null,
add column if not exists referred_by_code text default null,
add column if not exists referral_count integer not null default 0,
add column if not exists referral_credits integer not null default 0;

-- 3. Referrals ledger table
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id text not null,
  referred_user_id text not null unique,
  referral_code text not null,
  status text not null default 'completed',
  reward_days_granted integer not null default 7,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_referral_code on public.users(referral_code);
create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);
create index if not exists idx_referrals_code on public.referrals(referral_code);

-- Enable RLS on referrals table
alter table public.referrals enable row level security;

-- Policy: users can view their own referrals
create policy "Users can view their referrals"
  on public.referrals
  for select
  using (referrer_id = (select auth.jwt() ->> 'sub'));
