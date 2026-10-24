-- Raport săptămânal pe sursă (PostHog, HogQL). Ultimele 7 zile.
-- Sursa vine din utm_source de pe prima sesiune; fără UTM cade pe referrer, apoi 'direct'.
-- Rulat de workflow-ul de luni dimineața (sau manual în PostHog > SQL).
WITH s AS (
  SELECT
    person_id,
    argMin(coalesce(nullIf(properties.utm_source, ''), nullIf(properties.$referring_domain, '$direct'), 'direct'), timestamp) AS source,
    argMin(properties.utm_content, timestamp) AS content
  FROM events
  WHERE event = '$pageview' AND timestamp > now() - INTERVAL 7 DAY
  GROUP BY person_id
)
SELECT
  s.source,
  s.content,
  count(DISTINCT s.person_id) AS visitors,
  count(DISTINCT if(e.event = 'ats_scan_started', s.person_id, NULL)) AS scans,
  count(DISTINCT if(e.event = 'signup_completed', s.person_id, NULL)) AS signups,
  count(DISTINCT if(e.event = 'checkout_started', s.person_id, NULL)) AS checkouts,
  count(DISTINCT if(e.event = 'payment_completed', s.person_id, NULL)) AS payments
FROM s
LEFT JOIN events e ON e.person_id = s.person_id AND e.timestamp > now() - INTERVAL 7 DAY
GROUP BY s.source, s.content
ORDER BY visitors DESC
