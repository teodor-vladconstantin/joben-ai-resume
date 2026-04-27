import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { getErrorMessage } from '@/lib/api-response'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const body = (await req.json()) as {
      reviewId?: string
      resumeId?: string
      analysisJson?: Record<string, unknown>
      status?: 'pending' | 'applied'
    }

    if (!body.reviewId) {
      return jsonWithRequestId({ error: 'reviewId is required' }, 400, requestId)
    }

    const status = body.status === 'applied' ? 'applied' : 'pending'

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('resume_analyses')
      .insert({
        user_id: userId,
        resume_id: body.resumeId || null,
        review_id: body.reviewId,
        analysis_json: body.analysisJson || null,
        status,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Failed to create resume_analyses record', {
        requestId,
        userId,
        route: '/api/resume-analyses',
        error: error.message,
      })
      return jsonWithRequestId({ error: error.message }, 500, requestId)
    }

    return jsonWithRequestId({ id: data.id }, 201, requestId)
  } catch (error) {
    logger.error('resume-analyses POST failed', {
      requestId,
      error: getErrorMessage(error),
    })
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}

export async function PATCH(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: 'Unauthorized' }, 401, requestId)
    }

    const body = (await req.json()) as {
      reviewId?: string
      status?: 'pending' | 'applied'
    }

    if (!body.reviewId) {
      return jsonWithRequestId({ error: 'reviewId is required' }, 400, requestId)
    }

    const status = body.status === 'applied' ? 'applied' : 'pending'

    const supabase = createServerClient()

    const { error } = await supabase
      .from('resume_analyses')
      .update({
        status,
        applied_at: status === 'applied' ? new Date().toISOString() : null,
      })
      .eq('user_id', userId)
      .eq('review_id', body.reviewId)

    if (error) {
      logger.error('Failed to update resume_analyses record', {
        requestId,
        userId,
        route: '/api/resume-analyses PATCH',
        error: error.message,
      })
      return jsonWithRequestId({ error: error.message }, 500, requestId)
    }

    return jsonWithRequestId({ ok: true }, 200, requestId)
  } catch (error) {
    logger.error('resume-analyses PATCH failed', {
      requestId,
      error: getErrorMessage(error),
    })
    return jsonWithRequestId({ error: getErrorMessage(error) }, 500, requestId)
  }
}
