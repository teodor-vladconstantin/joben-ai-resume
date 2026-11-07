-- Email confirmation was replaced by a captcha: leads that opted in to marketing
-- but never confirmed are confirmed now, so the sequence starts on them.
update public.template_leads
set email_confirmed_at = now()
where marketing_consent = true
  and email_confirmed_at is null;
