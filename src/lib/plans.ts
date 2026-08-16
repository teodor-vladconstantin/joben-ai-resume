import { logger } from '@/lib/logger'
import { createServerClient } from '@/lib/supabase/server'

export type UserPlan = 'free' | 'pro' | 'recruiting'

const GOD_MODE_EMAILS = new Set(['duku.constantin@gmail.com'])

function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

export function isGodModeEmailAddress(email: string | null | undefined): boolean {
  return GOD_MODE_EMAILS.has(normalizeEmail(email))
}

export function getEmailHintFromSessionClaims(sessionClaims: unknown): string | undefined {
  if (!sessionClaims || typeof sessionClaims !== 'object') {
    return undefined
  }

  const claims = sessionClaims as Record<string, unknown>
  const candidate = claims.email
  return typeof candidate === 'string' ? candidate : undefined
}

type PlanDefinition = {
  id: UserPlan
  label: string
  aiContentGeneration: boolean
  bulletRewriteAccess: boolean
  resumeAnalysisAccess: boolean
  coverLetterGenerationAccess: boolean
  atsKeywordOptimization: boolean
  maxResumeExports: number | null
  priorityEmailSupport: boolean
  fullTemplateLibrary: boolean
}

export const PLAN_DEFINITIONS: Record<UserPlan, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Free',
    aiContentGeneration: true,
    bulletRewriteAccess: true,
    resumeAnalysisAccess: true,
    coverLetterGenerationAccess: true,
    atsKeywordOptimization: true,
    maxResumeExports: 5,
    priorityEmailSupport: false,
    fullTemplateLibrary: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    aiContentGeneration: true,
    bulletRewriteAccess: true,
    resumeAnalysisAccess: true,
    coverLetterGenerationAccess: true,
    atsKeywordOptimization: true,
    maxResumeExports: null,
    priorityEmailSupport: true,
    fullTemplateLibrary: false,
  },
  recruiting: {
    id: 'recruiting',
    label: 'Recruiting Plan',
    aiContentGeneration: true,
    bulletRewriteAccess: true,
    resumeAnalysisAccess: true,
    coverLetterGenerationAccess: true,
    atsKeywordOptimization: true,
    maxResumeExports: null,
    priorityEmailSupport: true,
    fullTemplateLibrary: true,
  },
}

export function normalizePlan(plan: string | null | undefined): UserPlan {
  if (plan === 'pro' || plan === 'recruiting' || plan === 'free') {
    return plan
  }

  return 'free'
}

export type PaidPlan = 'pro' | 'recruiting'

// Single source of truth for mapping a Stripe price ID back to the plan it
// sells, shared by the checkout route (choosing which price to charge) and
// the webhook handler (resolving an existing subscription's plan).
export function resolvePlanFromPriceId(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return 'pro'
  if (priceId === process.env.STRIPE_RECRUITING_PRICE_ID) return 'recruiting'
  return null
}

export function getPriceIdForPlan(plan: PaidPlan): string | undefined {
  return plan === 'recruiting' ? process.env.STRIPE_RECRUITING_PRICE_ID : process.env.STRIPE_PRO_PRICE_ID
}

export async function getUserPlan(userId: string, userEmailHint?: string | null): Promise<UserPlan> {
  if (isGodModeEmailAddress(userEmailHint)) {
    return 'recruiting'
  }

  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('users')
    .select('plan, email, lifetime_recruiting_unlocked')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (error) {
    logger.warn('Falling back to free plan due to users.plan fetch error', {
      source: 'getUserPlan',
      userId,
      error: error.message,
    })
    return 'free'
  }

  if (isGodModeEmailAddress(data?.email as string | undefined)) {
    logger.info('Applied GOD MODE plan override', {
      source: 'getUserPlan',
      userId,
    })
    return 'recruiting'
  }

  if (data?.lifetime_recruiting_unlocked) {
    logger.info('Applied lifetime recruiting override', {
      source: 'getUserPlan',
      userId,
    })
    return 'recruiting'
  }

  return normalizePlan((data?.plan as string | undefined) || 'free')
}

export async function isGodModeUser(userId: string): Promise<boolean> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('clerk_id', userId)
    .maybeSingle()
  return isGodModeEmailAddress(data?.email as string | undefined)
}

export function hasAiContentGenerationAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].aiContentGeneration
}

export function hasBulletRewriteAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].bulletRewriteAccess
}

export function hasResumeAnalysisAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].resumeAnalysisAccess
}

export function hasCoverLetterGenerationAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].coverLetterGenerationAccess
}

export function hasAtsOptimizationAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].atsKeywordOptimization
}

export type PlanQuotaResult = {
  allowed: boolean
  status: number
  error?: string
  showUpgrade?: boolean
  limit?: number
  used?: number
  remaining?: number
}

function deniedQuota(message: string, limit: number, used: number): PlanQuotaResult {
  return {
    allowed: false,
    status: 403,
    error: message,
    showUpgrade: true,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
  }
}

async function countUserResumeExports(userId: string): Promise<number | null> {
  const supabase = createServerClient()
  const { count, error } = await supabase
    .from('product_events')
    .select('id', { count: 'exact', head: true })
    .eq('user_clerk_id', userId)
    .eq('event_name', 'resume_exported_pdf')

  if (error) {
    logger.error('Failed to count user resume exports for plan quota', {
      source: 'countUserResumeExports',
      userId,
      error: error.message,
    })
    return null
  }

  return count || 0
}

export async function checkResumeExportQuota(
  userId: string,
  plan: UserPlan
): Promise<PlanQuotaResult> {
  const limit = PLAN_DEFINITIONS[plan].maxResumeExports
  if (limit === null) {
    return { allowed: true, status: 200 }
  }

  const used = await countUserResumeExports(userId)
  if (used === null) {
    return {
      allowed: false,
      status: 500,
      error: 'Could not validate export limits right now. Please try again.',
    }
  }

  if (used >= limit) {
    const exportNoun = limit === 1 ? 'resume export' : 'resume exports'
    return deniedQuota(
      `Free plan includes ${limit} ${exportNoun}. Upgrade to Pro for unlimited exports.`,
      limit,
      used
    )
  }

  return {
    allowed: true,
    status: 200,
    limit,
    used,
    remaining: Math.max(limit - used, 0),
  }
}
