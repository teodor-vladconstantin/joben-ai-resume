import { randomInt } from 'crypto'
import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { capturePostHogEvent } from '@/lib/posthog-server'

export const REFERRAL_COOKIE_NAME = 'jb_ref'
export const REFERRER_REWARD_DAYS = 7
export const REFERRED_REWARD_DAYS = 3
// Anti-farming: a referrer earns at most this many rewards per rolling 30 days.
export const MAX_REWARDED_REFERRALS_PER_30D = 5

const DAY_MS = 24 * 60 * 60 * 1000
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
async function grantProDays(userClerkId: string, days: number): Promise<void> {
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
}

export async function getUserReferralInfo(userId: string): Promise<{
  referralCode: string
  referralCount: number
  referralCredits: number
  referralLink: string
}> {
  const supabase = createServerClient()
  const { data: user } = await supabase
    .from('users')
    .select('referral_code, referral_count, referral_credits')
    .eq('clerk_id', userId)
    .maybeSingle()

  let referralCode: string | null = user?.referral_code ?? null
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
      referralCode = fresh?.referral_code ?? null
      if (!referralCode) break // no users row yet (webhook not synced)
    }
  }
  if (!referralCode) throw new Error('referral code assign failed after retries')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://joben.eu'
  const referralLink = `${appUrl}/?ref=${referralCode}`

  return {
    referralCode,
    referralCount: user?.referral_count ?? 0,
    referralCredits: user?.referral_credits ?? 0,
    referralLink,
  }
}

export interface ProcessReferralResult {
  success: boolean
  referrerId?: string
  referrerRewardDays?: number
  referredRewardDays?: number
  message?: string
}

export async function processReferralAttribution(input: {
  newUserId: string
  referralCode: string
}): Promise<ProcessReferralResult> {
  const code = formatReferralCode(input.referralCode)
  if (!code) {
    return { success: false, message: 'Invalid referral code.' }
  }

  const supabase = createServerClient()

  const { data: referrer, error: referrerError } = await supabase
    .from('users')
    .select('clerk_id')
    .eq('referral_code', code)
    .maybeSingle()

  if (referrerError || !referrer) {
    logger.warn('Referral attribution: code not found', { newUserId: input.newUserId })
    return { success: false, message: 'Referrer not found.' }
  }

  if (referrer.clerk_id === input.newUserId) {
    return { success: false, message: 'Self-referral is not allowed.' }
  }

  const since = new Date(Date.now() - 30 * DAY_MS).toISOString()
  const { count: recentCount, error: countError } = await supabase
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrer.clerk_id)
    .eq('status', 'completed')
    .gte('created_at', since)
  if (countError) throw new Error(`referral cap lookup failed: ${countError.message}`)
  const capped = (recentCount ?? 0) >= MAX_REWARDED_REFERRALS_PER_30D

  // The unique referred_user_id makes this insert the claim: a retry or a
  // concurrent call loses here (23505) before anything is granted.
  const { error: claimError } = await supabase.from('referrals').insert({
    referrer_id: referrer.clerk_id,
    referred_user_id: input.newUserId,
    referral_code: code,
    status: capped ? 'capped' : 'completed',
    reward_days_granted: capped ? 0 : REFERRER_REWARD_DAYS,
  })
  if (claimError) {
    if (claimError.code === '23505') {
      return { success: false, message: 'User already attributed to a referral.' }
    }
    throw new Error(`referral claim failed: ${claimError.message}`)
  }

  if (capped) {
    logger.warn('Referral attribution: referrer hit 30-day cap', { referrerId: referrer.clerk_id })
    return { success: false, message: 'Referral limit reached.' }
  }

  try {
    await grantProDays(referrer.clerk_id, REFERRER_REWARD_DAYS)
    await grantProDays(input.newUserId, REFERRED_REWARD_DAYS)
  } catch (error) {
    await supabase.from('referrals').update({ status: 'failed' }).eq('referred_user_id', input.newUserId)
    throw error
  }

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
  await supabase.from('users').update({ referred_by_code: code }).eq('clerk_id', input.newUserId)

  await capturePostHogEvent({
    distinctId: referrer.clerk_id,
    event: 'referral_reward_earned',
    properties: {
      newUserId: input.newUserId,
      rewardDays: REFERRER_REWARD_DAYS,
      totalReferrals: newReferralCount,
    },
  })

  logger.info('Referral attribution completed', {
    referrerId: referrer.clerk_id,
    newUserId: input.newUserId,
  })

  return {
    success: true,
    referrerId: referrer.clerk_id,
    referrerRewardDays: REFERRER_REWARD_DAYS,
    referredRewardDays: REFERRED_REWARD_DAYS,
  }
}
