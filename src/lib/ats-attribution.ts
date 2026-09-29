// Where a sign-up that started from the free ATS checker came from, and which
// anonymous scan it belongs to. Parsed from the sign-up URL on the client,
// carried through Clerk as unsafeMetadata, and re-validated in the Clerk
// webhook (unsafeMetadata is user-editable, so never trusted as-is).
//
// URL shapes:
//   result page CTA   /sign-up?from=ats&scan=<id>
//   rate-limited CTA  /sign-up?from=ats_rate_limited
//   email CTAs        /sign-up?utm_source=email&utm_campaign=anon_scan_<type>&scan=<id>

export const ATS_SIGNUP_SOURCES = ['result_page', 'rate_limited', 'email_report', 'email_48h', 'email_7d'] as const
export type AtsSignupSource = (typeof ATS_SIGNUP_SOURCES)[number]

export type AtsSignupAttribution = {
  source: AtsSignupSource
  scanId: string | null
}

const SCAN_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const EMAIL_CAMPAIGN_SOURCES: Record<string, AtsSignupSource> = {
  anon_scan_report: 'email_report',
  anon_scan_48h: 'email_48h',
  anon_scan_7d: 'email_7d',
}

export function toScanId(value: unknown): string | null {
  return typeof value === 'string' && SCAN_ID_PATTERN.test(value) ? value.toLowerCase() : null
}

export function parseAtsSignupAttribution(params: URLSearchParams): AtsSignupAttribution | null {
  const from = params.get('from')
  let source: AtsSignupSource | null = null

  if (from === 'ats') source = 'result_page'
  else if (from === 'ats_rate_limited') source = 'rate_limited'
  else if (params.get('utm_source') === 'email') source = EMAIL_CAMPAIGN_SOURCES[params.get('utm_campaign') || ''] ?? null

  return source ? { source, scanId: toScanId(params.get('scan')) } : null
}

export function isEmailAtsSource(source: AtsSignupSource): boolean {
  return source.startsWith('email_')
}

// Reads what the sign-up page put in Clerk unsafeMetadata (atsSource, atsScanId).
export function readAtsSignupAttribution(metadata: unknown): AtsSignupAttribution | null {
  if (!metadata || typeof metadata !== 'object') return null
  const { atsSource, atsScanId } = metadata as Record<string, unknown>
  if (typeof atsSource !== 'string' || !(ATS_SIGNUP_SOURCES as readonly string[]).includes(atsSource)) return null
  return { source: atsSource as AtsSignupSource, scanId: toScanId(atsScanId) }
}
