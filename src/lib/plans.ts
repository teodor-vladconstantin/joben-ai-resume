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
  maxResumes: number | null
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
    maxResumes: 1,
    maxResumeExports: null,
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
    maxResumes: 3,
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
    maxResumes: 15,
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

async function countUserResumes(userId: string): Promise<number | null> {
  const supabase = createServerClient()
  const { count, error } = await supabase
    .from('resumes')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) {
    logger.error('Failed to count user resumes for plan quota', {
      source: 'countUserResumes',
      userId,
      error: error.message,
    })
    return null
  }

  return count || 0
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

export async function checkResumeCreationQuota(
  userId: string,
  plan: UserPlan
): Promise<PlanQuotaResult> {
  const limit = PLAN_DEFINITIONS[plan].maxResumes
  if (limit === null) {
    return { allowed: true, status: 200 }
  }

  const used = await countUserResumes(userId)
  if (used === null) {
    return {
      allowed: false,
      status: 500,
      error: 'Could not validate plan limits right now. Please try again.',
    }
  }

  if (used >= limit) {
    const planLabel = PLAN_DEFINITIONS[plan].label
    const nextPlan = plan === 'free' ? 'Pro' : 'Recruiting'
    return deniedQuota(
      `${planLabel} plan allows up to ${limit} resumes. Upgrade to ${nextPlan} for more resumes.`,
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
    return deniedQuota(
      `Free plan includes ${limit} resume export. Upgrade to Pro for unlimited exports.`,
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
