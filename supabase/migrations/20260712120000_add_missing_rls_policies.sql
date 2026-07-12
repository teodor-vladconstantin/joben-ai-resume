-- Defense-in-depth: these three tables store user-linked PII (email,
-- AI analysis of resume content, feedback free-text) but were created
-- without RLS. The app only ever accesses Supabase via the service-role
-- key (which bypasses RLS), so this does not change current app behavior —
-- it closes the gap for any future client-side or anon-key access path.

alter table public.email_events enable row level security;

drop policy if exists email_events_select_own on public.email_events;
create policy email_events_select_own on public.email_events
for select
using (user_clerk_id = (auth.jwt() ->> 'sub'));

alter table public.resume_analyses enable row level security;

drop policy if exists resume_analyses_rw_own on public.resume_analyses;
create policy resume_analyses_rw_own on public.resume_analyses
for all
using (user_id = (auth.jwt() ->> 'sub'))
with check (user_id = (auth.jwt() ->> 'sub'));

alter table public.feedback enable row level security;

drop policy if exists feedback_select_own on public.feedback;
create policy feedback_select_own on public.feedback
for select
using (user_id = (auth.jwt() ->> 'sub'));
