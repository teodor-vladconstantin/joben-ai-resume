-- Needed by the anonymous-scan email nurture sequence (48h follow-up) to
-- frame the reminder around the specific weak spot found at scan time,
-- without persisting the resume content itself, just which of the 4 fixed
-- score categories came out lowest.
alter table public.anonymous_scans
  add column if not exists weakest_category text;
