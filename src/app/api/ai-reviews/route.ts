import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError(clientErrorMessage('auth'), 401)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('ai_reviews')
      .select('id, score, created_at, resume_id, feedback, resumes(title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      if (isMissingRelation(error)) {
        return apiSuccess({ reviews: [] }, 200)
      }
      logger.error('ai-reviews GET failed', { userId, error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ reviews: data || [] }, 200)
  } catch (error) {
    logger.error('ai-reviews GET top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
