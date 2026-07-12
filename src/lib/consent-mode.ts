// Google Consent Mode v2. GTM's "Google Tag" (GA4) has built-in consent
// checks (ad_storage, ad_personalization, ad_user_data, analytics_storage)
// that it enforces regardless of app code — with no signal at all, Google
// defaults EU traffic to denied and silently drops full measurement instead
// of erroring, which is why GA4 showed 0 users despite the tag firing.
// This sets an explicit deny-by-default baseline (GDPR-correct: no tracking
// until the user opts in) and updates it when the cookie banner is answered.
export const CONSENT_MODE_DEFAULT_SCRIPT = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  'ad_storage': 'denied',
  'ad_user_data': 'denied',
  'ad_personalization': 'denied',
  'analytics_storage': 'denied'
});
`

export function pushConsentUpdate(accepted: boolean): void {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push([
    'consent',
    'update',
    {
      // Joben runs no ads/remarketing — only analytics_storage actually
      // varies with the user's choice; the ad_* signals stay denied.
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: accepted ? 'granted' : 'denied',
    },
  ])
}
