import { createServerClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'

type ReviewFeedback = {
  overall_score?: number
  grade?: string
  categories?: {
    ats_structure?: { score?: number }
    content_quality?: { score?: number }
    writing_quality?: { score?: number }
    job_match?: { score?: number }
    application_ready?: { score?: number }
  }
}

export type DashboardStats = {
  resumes: number
  coverLetters: number
  aiReviews: number
  averageScore: number
}

export type ScoreBreakdown = {
  ats: number
  content: number
  writing: number
  match: number
  ready: number
}

export type LatestReviewSummary = {
  totalScore: number
  grade: string
  breakdown: ScoreBreakdown
} | null

export type RecentDocument = {
  id: string
  title: string | null
  updated_at: string
  score?: number
  type: 'resume' | 'cover_letter'
}

export type EmailTrackingStats = {
  total: number
  sent: number
  failed: number
  processing: number
  skipped: number
  last7d: number
  lastSentAt: string | null
}

export type AiReviewTrendPoint = {
  id: string
  resume_id: string | null
  score: number
  created_at: string
}

export type ProductFunnelStage = {
  key: string
  label: string
  count: number
  conversionFromCreate: number
}

const emptyBreakdown: ScoreBreakdown = {
  ats: 0,
  content: 0,
  writing: 0,
  match: 0,
  ready: 0,
}

function normalizeBreakdown(feedback: ReviewFeedback | null): ScoreBreakdown {
  if (!feedback?.categories) return emptyBreakdown

  return {
    ats: Number(feedback.categories.ats_structure?.score || 0),
    content: Number(feedback.categories.content_quality?.score || 0),
    writing: Number(feedback.categories.writing_quality?.score || 0),
    match: Number(feedback.categories.job_match?.score || 0),
    ready: Number(feedback.categories.application_ready?.score || 0),
  }
}

export async function getUserDashboardStats(userId: string) {
  try {
    const supabase = createServerClient()

    const [resumesRes, coverLettersRes, aiReviewsRes] = await Promise.all([
      supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('cover_letters').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('ai_reviews').select('*', { count: 'exact', head: true }).eq('user_id', userId)
    ])

    const { data: reviewScores } = await supabase
      .from('ai_reviews')
      .select('score')
      .eq('user_id', userId)
      .limit(50)

    const scores = (reviewScores || []).map((row) => Number(row.score || 0))
    const averageScore =
      scores.length > 0
        ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
        : 0

    return {
      resumes: resumesRes.count || 0,
      coverLetters: coverLettersRes.count || 0,
      aiReviews: aiReviewsRes.count || 0,
      averageScore,
    } as DashboardStats
  } catch (error) {
    logger.error('Supabase dashboard stats fetch failed', {
      source: 'getUserDashboardStats',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { resumes: 0, coverLetters: 0, aiReviews: 0, averageScore: 0 } as DashboardStats
  }
}

export async function getRecentDocuments(userId: string) {
  try {
    const supabase = createServerClient()

    const [resumesRes, coverLettersRes] = await Promise.all([
      supabase
        .from('resumes')
        .select('id, title, updated_at, score')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
      supabase
        .from('cover_letters')
        .select('id, title, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
    ])

    const resumes = (resumesRes.data || []).map((row) => ({
      ...row,
      type: 'resume' as const,
    }))
    const coverLetters = (coverLettersRes.data || []).map((row) => ({
      ...row,
      type: 'cover_letter' as const,
    }))

    const merged = [...resumes, ...coverLetters]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3)

    return merged as RecentDocument[]
  } catch (error) {
    logger.error('Supabase recent documents fetch failed', {
      source: 'getRecentDocuments',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return [] as RecentDocument[]
  }
}

export async function getLatestReviewSummary(userId: string): Promise<LatestReviewSummary> {
  try {
    const supabase = createServerClient()

    const { data } = await supabase
      .from('ai_reviews')
      .select('score, feedback')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) return null

    const feedback = (data.feedback || null) as ReviewFeedback | null
    const breakdown = normalizeBreakdown(feedback)
    const breakdownTotal = Object.values(breakdown).reduce((sum, value) => sum + value, 0)

    return {
      totalScore: Number(feedback?.overall_score || data.score || breakdownTotal || 0),
      grade: feedback?.grade || 'Unknown',
      breakdown,
    }
  } catch (error) {
    logger.error('Supabase latest review fetch failed', {
      source: 'getLatestReviewSummary',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

export async function getUserResumes(userId: string) {
  try {
    const supabase = createServerClient()

    const { data: resumes } = await supabase
      .from('resumes')
      .select('id, title, updated_at, score')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    return resumes || []
  } catch (error) {
    logger.error('Supabase resumes fetch failed', {
      source: 'getUserResumes',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export async function deleteResume(resumeId: string, userId: string) {
  try {
    const supabase = createServerClient()

    const { error } = await supabase
      .from('resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', userId)

    if (error) {
      throw error
    }
    return { success: true }
  } catch (error) {
    logger.error('Supabase resume delete failed', {
      source: 'deleteResume',
      userId,
      resumeId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { success: false, error }
  }
}

export async function getEmailTrackingStats(userId: string): Promise<EmailTrackingStats> {
  try {
    const supabase = createServerClient()
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('email_events')
      .select('status, created_at')
      .eq('user_clerk_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000)

    if (error) {
      throw error
    }

    const rows = data || []
    const sent = rows.filter((row) => row.status === 'sent').length
    const failed = rows.filter((row) => row.status === 'failed').length
    const processing = rows.filter((row) => row.status === 'processing').length
    const skipped = rows.filter((row) => row.status === 'skipped').length
    const last7d = rows.filter((row) => row.created_at >= sevenDaysAgo).length

    const latestSent = rows.find((row) => row.status === 'sent')

    return {
      total: rows.length,
      sent,
      failed,
      processing,
      skipped,
      last7d,
      lastSentAt: latestSent?.created_at || null,
    }
  } catch (error) {
    logger.error('Supabase email tracking stats fetch failed', {
      source: 'getEmailTrackingStats',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return {
      total: 0,
      sent: 0,
      failed: 0,
      processing: 0,
      skipped: 0,
      last7d: 0,
      lastSentAt: null,
    }
  }
}

export async function getAiReviewTrend(userId: string, limit = 8): Promise<AiReviewTrendPoint[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('ai_reviews')
      .select('id, resume_id, score, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(Math.max(limit * 4, 20))

    if (error) {
      throw error
    }

    const rows = (data || []).map((row) => ({
      id: row.id,
      resume_id: row.resume_id,
      score: Number(row.score || 0),
      created_at: row.created_at,
    }))

    return rows.slice(-Math.max(limit, 1))
  } catch (error) {
    logger.error('Supabase AI review trend fetch failed', {
      source: 'getAiReviewTrend',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return []
  }
}

export async function getProductFunnelStats(userId: string, lookbackDays = 30): Promise<ProductFunnelStage[]> {
  const stages = [
    { key: 'resume_created', label: 'Resume Created' },
    { key: 'resume_analyzed', label: 'Resume Analyzed' },
    { key: 'bullet_improved', label: 'Bullet Improved' },
    { key: 'resume_exported_pdf', label: 'Exported PDF' },
    { key: 'checkout_started', label: 'Upgrade Checkout Started' },
  ]

  try {
    const supabase = createServerClient()
    const cutoff = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('product_events')
      .select('event_name')
      .eq('user_clerk_id', userId)
      .gte('created_at', cutoff)

    if (error) {
      throw error
    }

    const counts = new Map<string, number>()
    for (const row of data || []) {
      counts.set(row.event_name, (counts.get(row.event_name) || 0) + 1)
    }

    const baseline = counts.get('resume_created') || 0
    return stages.map((stage) => {
      const count = counts.get(stage.key) || 0
      return {
        key: stage.key,
        label: stage.label,
        count,
        conversionFromCreate: baseline > 0 ? Math.round((count / baseline) * 100) : 0,
      }
    })
  } catch (error) {
    logger.error('Supabase product funnel stats fetch failed', {
      source: 'getProductFunnelStats',
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return stages.map((stage) => ({
      key: stage.key,
      label: stage.label,
      count: 0,
      conversionFromCreate: 0,
    }))
  }
}
