-- Beta feedback captured from the /feedback form.
-- Mirrors migrations/feedback.sql. Writes go through the Supabase service
-- role key (server action), so no RLS policies are added here.

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  user_email text,
  likes text not null,
  improvements text not null,
  nps integer not null check (nps between 0 and 10),
  created_at timestamptz default now()
);

-- One feedback submission per user is enforced in the server action; this
-- index keeps the "already submitted" lookup fast.
create index if not exists feedback_user_id_idx on feedback (user_id);
