create table if not exists public.resume_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  resume_id uuid references public.resumes(id) on delete set null,
  review_id uuid references public.ai_reviews(id) on delete set null,
  analysis_json jsonb,
  status text not null default 'pending' check (status in ('pending', 'applied')),
  applied_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_resume_analyses_user_id on public.resume_analyses(user_id);
create index if not exists idx_resume_analyses_resume_id on public.resume_analyses(resume_id);
create index if not exists idx_resume_analyses_review_id on public.resume_analyses(review_id);
