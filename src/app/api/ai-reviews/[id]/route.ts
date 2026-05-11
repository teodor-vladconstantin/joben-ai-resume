import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { uuidLike } from '@/lib/validation/schemas'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const { id } = await params
    const parsedId = uuidLike.safeParse(id)
    if (!parsedId.success) {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('ai_reviews')
      .select('id, score, created_at, resume_id, feedback, resumes(title)')
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'AI reviews table is missing in Supabase.'), 500)
      }
      logger.error('ai-reviews [id] GET failed', { userId, reviewId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('not_found'), 404)
    }

    let comparison: {
      previousScore: number | null
      previousReviewId: string | null
      delta: number | null
    } | null = null

    if (data.resume_id) {
      const { data: previous } = await supabase
        .from('ai_reviews')
        .select('id, score, created_at')
        .eq('user_id', userId)
        .eq('resume_id', data.resume_id)
        .lt('created_at', data.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (previous) {
        const currentScore = Number(data.score || 0)
        const previousScore = Number(previous.score || 0)
        comparison = {
          previousScore,
          previousReviewId: previous.id,
          delta: currentScore - previousScore,
        }
      } else {
        comparison = {
          previousScore: null,
          previousReviewId: null,
          delta: null,
        }
      }
    }

    return apiSuccess({ review: data, comparison }, 200)
  } catch (error) {
    logger.error('ai-reviews [id] GET top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
