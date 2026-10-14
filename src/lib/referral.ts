import { randomInt } from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'
import { invalidatePlanCache } from '@/lib/ratelimit'
import { sendReferralRewardEmail } from '@/lib/resend'
import { getUserLocale } from '@/lib/user-locale'
import {
  MAX_REWARDED_REFERRALS_PER_30D,
  MAX_REWARDED_REFERRALS_TOTAL,
  REFERRED_REWARD_DAYS,
  REFERRER_REWARD_DAYS,
} from '@/lib/referral-shared'

export {
  MAX_REWARDED_REFERRALS_PER_30D,
  MAX_REWARDED_REFERRALS_TOTAL,
  REFERRAL_COOKIE_NAME,
  REFERRED_REWARD_DAYS,
  REFERRER_REWARD_DAYS,
} from '@/lib/referral-shared'

const DAY_MS = 24 * 60 * 60 * 1000
// A referral can only be claimed by an account created within this window
// (covers a slow email verification, blocks existing accounts).
const REFERRAL_CLAIM_WINDOW_DAYS = 7
// No 0/O/1/I so codes survive being read aloud or retyped.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function formatReferralCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30)
}

export function generateReferralCode(): string {
  let suffix = ''
  for (let i = 0; i < 8; i++) suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)]
  return `JOBEN-${suffix}`
}

// Extends an active grant, otherwise starts from now.
export function extendExpiry(current: string | null | undefined, days: number, now = Date.now()): string {
  const currentMs = current ? new Date(current).getTime() : 0
  return new Date(Math.max(now, currentMs) + days * DAY_MS).toISOString()
}

// A time-limited grant only lifts free users; paid plans keep their stored plan.
// Returns the new pro_expires_at.
async function grantProDays(userClerkId: string, days: number): Promise<string> {
  const supabase = createServerClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, pro_expires_at')
    .eq('clerk_id', userClerkId)
    .maybeSingle()
  if (error || !user) throw new Error(`grantProDays lookup failed: ${error?.message ?? 'user not found'}`)

  const update: { pro_expires_at: string; plan?: string } = {
    pro_expires_at: extendExpiry(user.pro_expires_at, days),
  }
  if (!user.plan || user.plan === 'free') update.plan = 'pro'

  const { error: updateError } = await supabase.from('users').update(update).eq('clerk_id', userClerkId)
  if (updateError) throw new Error(`grantProDays update failed: ${updateError.message}`)
  await invalidatePlanCache(userClerkId)
  return update.pro_expires_at
}

export interface ReferralInfo {
  referralCode: string
  referralCount: number
  referralCredits: number
  referralLink: string
  proExpiresAt: string | null
}

// null while the users row does not exist yet (Clerk webhook not synced).
export async function getUserReferralInfo(userId: string): Promise<ReferralInfo | null> {
  const supabase = createServerClient()
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('referral_code, referral_count, referral_credits, pro_expires_at')
    .eq('clerk_id', userId)
    .maybeSingle()
  if (userError) throw new Error(`referral info lookup failed: ${userError.message}`)
  if (!user) return null

  let referralCode: string | null = user.referral_code ?? null
  // Assigned lazily; retry on the rare unique-collision (23505).
  for (let attempt = 0; !referralCode && attempt < 3; attempt++) {
    const candidate = generateReferralCode()
    const { error } = await supabase
      .from('users')
      .update({ referral_code: candidate })
      .eq('clerk_id', userId)
      .is('referral_code', null)
    if (error && error.code !== '23505') throw new Error(`referral code assign failed: ${error.message}`)
    if (!error) {
      // Re-read: a concurrent request may have assigned a code first.
      const { data: fresh } = await supabase
        .from('users')
        .select('referral_code')
        .eq('clerk_id', userId)
        .maybeSingle()
      if (!fresh) return null // users row deleted meanwhile
      referralCode = fresh.referral_code ?? null
    }
  }
  if (!referralCode) throw new Error('referral code assign failed after retries')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://joben.eu'
  const referralLink = `${appUrl}/?ref=${referralCode}`

  return {
    referralCode,
    referralCount: user.referral_count ?? 0,
    referralCredits: user.referral_credits ?? 0,
    referralLink,
    proExpiresAt: user.pro_expires_at ?? null,
  }
}

export interface ProcessReferralResult {
  success: boolean
  status?: 'completed' | 'capped'
  referrerId?: string
  referrerRewardDays?: number
  referredRewardDays?: number
  message?: string
}

// Idempotent: the unique referrals.referred_user_id row is the claim, so the
// Clerk webhook may call this on user.created and again on user.updated.
// Throws on transient DB errors (after releasing the claim) so the caller can
// answer 5xx and let the provider retry; business rejections return
// success:false. Never logs the referral code.
export async function processReferralAttribution(input: {
  newUserId: string
  referralCode: string
}): Promise<ProcessReferralResult> {
  const code = formatReferralCode(input.referralCode)
  if (!code) {
    return { success: false, message: 'Invalid referral code.' }
  }

  const supabase = createServerClient()

  const { data: existing, error: existingError } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_user_id', input.newUserId)
    .maybeSingle()
  if (existingError) throw new Error(`referral claim lookup failed: ${existingError.message}`)
  if (existing) {
    return { success: false, message: 'User already attributed to a referral.' }
  }

  // unsafe_metadata.ref is client-editable and the Clerk webhook also runs on
  // user.updated, so only brand-new accounts may claim a referral.
  const { data: referred, error: referredError } = await supabase
    .from('users')
    .select('created_at')
    .eq('clerk_id', input.newUserId)
    .maybeSingle()
  if (referredError) throw new Error(`referred user lookup failed: ${referredError.message}`)
  const createdAtMs = referred?.created_at ? new Date(referred.created_at).getTime() : NaN
  if (!Number.isFinite(createdAtMs) || Date.now() - createdAtMs > REFERRAL_CLAIM_WINDOW_DAYS * DAY_MS) {
    return { success: false, message: 'Account is too old to claim a referral.' }
  }

  const { data: referrer, error: referrerError } = await supabase
    .from('users')
    .select('clerk_id, email')
    .eq('referral_code', code)
    .maybeSingle()
  if (referrerError) throw new Error(`referrer lookup failed: ${referrerError.message}`)

  if (!referrer) {
    logger.warn('Referral attribution: code not found', { newUserId: input.newUserId })
    return { success: false, message: 'Referrer not found.' }
  }

  if (referrer.clerk_id === input.newUserId) {
    return { success: false, message: 'Self-referral is not allowed.' }
  }

  const since = new Date(Date.now() - 30 * DAY_MS).toISOString()
  const [recent, total] = await Promise.all([
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.clerk_id)
      .eq('status', 'completed')
      .gte('created_at', since),
    supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.clerk_id)
      .eq('status', 'completed'),
  ])
  const countError = recent.error ?? total.error
  if (countError) throw new Error(`referral cap lookup failed: ${countError.message}`)
  const capped =
    (recent.count ?? 0) >= MAX_REWARDED_REFERRALS_PER_30D || (total.count ?? 0) >= MAX_REWARDED_REFERRALS_TOTAL
  const status = capped ? 'capped' : 'completed'
  const referrerRewardDays = capped ? 0 : REFERRER_REWARD_DAYS

  // The unique referred_user_id makes this insert the claim: a retry or a
  // concurrent call loses here (23505) before anything is granted.
  const { error: claimError } = await supabase.from('referrals').insert({
    referrer_id: referrer.clerk_id,
    referred_user_id: input.newUserId,
    referral_code: code,
    status,
    reward_days_granted: referrerRewardDays,
  })
  if (claimError) {
    if (claimError.code === '23505') {
      return { success: false, message: 'User already attributed to a referral.' }
    }
    throw new Error(`referral claim failed: ${claimError.message}`)
  }

  // The new user is rewarded even when the referrer is capped. On failure the
  // claim is released so the webhook retry redoes the whole attribution.
  // ponytail: if only the referrer grant fails, the retry grants the new user
  // again (+3 days twice); a per-side granted flag would close that.
  let referrerProUntil: string | null = null
  try {
    await grantProDays(input.newUserId, REFERRED_REWARD_DAYS)
    if (!capped) referrerProUntil = await grantProDays(referrer.clerk_id, REFERRER_REWARD_DAYS)
  } catch (error) {
    const { error: releaseError } = await supabase
      .from('referrals')
      .delete()
      .eq('referred_user_id', input.newUserId)
    if (releaseError) {
      logger.error('Referral attribution: could not release claim', {
        newUserId: input.newUserId,
        error: releaseError.message,
      })
    }
    throw error
  }

  await supabase.from('users').update({ referred_by_code: code }).eq('clerk_id', input.newUserId)

  if (capped) {
    logger.warn('Referral attribution: referrer hit 30-day cap', { referrerId: referrer.clerk_id })
  } else {
    // Derived from the ledger, so concurrent attributions cannot lose updates.
    const { count: totalCount } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_id', referrer.clerk_id)
      .eq('status', 'completed')
    const newReferralCount = totalCount ?? 0
    await supabase
      .from('users')
      .update({ referral_count: newReferralCount, referral_credits: newReferralCount * REFERRER_REWARD_DAYS })
      .eq('clerk_id', referrer.clerk_id)

    await capturePostHogEvent({
      distinctId: referrer.clerk_id,
      event: 'referral_reward_earned',
      properties: {
        newUserId: input.newUserId,
        rewardDays: REFERRER_REWARD_DAYS,
        totalReferrals: newReferralCount,
      },
    })

    // Best-effort: the grant is already done, so a failed email must neither
    // undo it nor make the webhook retry.
    if (referrer.email && referrerProUntil) {
      try {
        const sent = await sendReferralRewardEmail({
          to: referrer.email,
          locale: await getUserLocale(referrer.clerk_id),
          days: REFERRER_REWARD_DAYS,
          proUntil: referrerProUntil,
          remainingRewards: Math.max(0, MAX_REWARDED_REFERRALS_TOTAL - newReferralCount),
        })
        if (!sent.success) {
          logger.warn('Referral reward email not sent', { referrerId: referrer.clerk_id, error: sent.error })
        }
      } catch (error) {
        logger.warn('Referral reward email failed', {
          referrerId: referrer.clerk_id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }
  }

  logger.info('Referral attribution completed', {
    referrerId: referrer.clerk_id,
    newUserId: input.newUserId,
    status,
  })

  return {
    success: true,
    status,
    referrerId: referrer.clerk_id,
    referrerRewardDays,
    referredRewardDays: REFERRED_REWARD_DAYS,
  }
}
