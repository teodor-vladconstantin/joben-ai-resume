-- Feedback table for the beta feedback form at /feedback.
-- Run this manually against Supabase if the table does not exist yet
-- (Supabase SQL editor, or `npx supabase db push` picks up the mirrored
-- migration in supabase/migrations/).

create table feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text,
  likes text not null,
  improvements text not null,
  nps integer not null check (nps between 0 and 10),
  created_at timestamptz default now()
);
