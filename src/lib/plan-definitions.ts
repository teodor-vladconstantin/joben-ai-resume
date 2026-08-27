// Client-safe plan declarations — no imports of server-only code (Supabase
// service-role client, etc.). Split out of src/lib/plans.ts specifically so
// components like TemplateSwitcher can read plan capabilities (e.g.
// fullTemplateLibrary) without bundling a server-only module into the
// client. src/lib/plans.ts re-exports everything here, so existing imports
// of UserPlan/PLAN_DEFINITIONS/etc. from '@/lib/plans' are unaffected.

export type UserPlan = 'free' | 'pro' | 'recruiting'

export type PlanDefinition = {
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

// Only 'recruiting' has this today (per content.ts pricing copy — Free's
// card explicitly excludes "Full template library", Pro's "Everything in
// Free, plus" list never mentions templates, only Recruiting's card
// advertises "Full template library access"). Gating that shows an upgrade
// prompt on Pro too is intentional, not a bug — matches the actual plan.
export function hasFullTemplateLibraryAccess(plan: UserPlan): boolean {
  return PLAN_DEFINITIONS[plan].fullTemplateLibrary
}
