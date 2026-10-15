// Client-safe referral constants and helpers (src/lib/referral.ts is
// server-only: it pulls in the Supabase service-role client).
export const REFERRAL_COOKIE_NAME = 'jb_ref'
export const REFERRER_REWARD_DAYS = 7
export const REFERRED_REWARD_DAYS = 3
// Anti-farming: a referrer earns at most this many rewards per rolling 30 days,
// and at most MAX_REWARDED_REFERRALS_TOTAL ever. Friends are rewarded regardless.
export const MAX_REWARDED_REFERRALS_PER_30D = 3
export const MAX_REWARDED_REFERRALS_TOTAL = 10

// Reads the jb_ref cookie set by src/proxy.ts from a ?ref= link. The sign-up
// and sign-in pages copy it into Clerk unsafeMetadata.ref; the Clerk webhook
// re-validates it.
export function readReferralCookie(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)jb_ref=([A-Z0-9_-]{1,30})(?:;|$)/)
  return match ? match[1] : null
}
