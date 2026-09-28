-- resumes.score was only ever written as 0 on insert (/api/analyze never
-- updated it), so every resume in the list showed a score of 0. Backfill
-- each resume from its most recent AI review. The updated_at trigger is
-- paused so this does not mark every resume as edited today.
alter table public.resumes disable trigger trg_resumes_updated_at;

update public.resumes r
set score = latest.score
from (
  select distinct on (resume_id) resume_id, score
  from public.ai_reviews
  where resume_id is not null
  order by resume_id, created_at desc
) latest
where latest.resume_id = r.id;

alter table public.resumes enable trigger trg_resumes_updated_at;
