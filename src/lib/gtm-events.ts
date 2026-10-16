// GA4 events via GTM's dataLayer. Consent Mode (see consent-mode.ts) gates
// storage and identifiers, so pushing before the banner is answered is safe.
// Params are non-PII only: no email, scan id or user id.
type GtmEventName =
  | 'ats_scan_completed'
  | 'sign_up_started'
  | 'begin_checkout'
  | 'cta_click'
  | 'pricing_viewed'
  | 'plan_cta_click'

// "GA1.1.123456789.987654321" -> "123456789.987654321". The `_ga` cookie only
// exists once analytics consent was granted, so no cookie means no server-side tracking.
export function getGaClientId(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/)
  return match?.[1]
}

export function pushGtmEvent(event: GtmEventName, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
