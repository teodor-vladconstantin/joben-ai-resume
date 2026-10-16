// GA4 events via GTM's dataLayer. Consent Mode (see consent-mode.ts) gates
// storage and identifiers, so pushing before the banner is answered is safe.
// Params are non-PII only: no email, scan id or user id.
type GtmEventName = 'ats_scan_completed' | 'sign_up_started' | 'begin_checkout' | 'purchase'

export function pushGtmEvent(event: GtmEventName, params: Record<string, string | number> = {}): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...params })
}
