import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, jsonWithRequestId, logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { resumeAnalysisCreateSchema, resumeAnalysisPatchSchema } from '@/lib/validation/schemas'

export async function POST(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = resumeAnalysisCreateSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
    const status = body.status === 'applied' ? 'applied' : 'pending'

    const supabase = createServerClient()

    // SECURITY: CLAUDE.md High #7 — the client may submit any resumeId, so
    // verify ownership before attaching the analysis. Prevents cross-user
    // data integrity attacks (analyses linked to other users' resumes).
    if (body.resumeId) {
      const { data: ownership, error: ownershipError } = await supabase
        .from('resumes')
        .select('id')
        .eq('id', body.resumeId)
        .eq('user_id', userId)
        .maybeSingle()

      if (ownershipError) {
        logger.error('resume-analyses ownership lookup failed', {
          requestId,
          userId,
          route: '/api/resume-analyses',
          error: ownershipError.message,
        })
        return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
      }

      if (!ownership) {
        return jsonWithRequestId({ error: clientErrorMessage('forbidden') }, 403, requestId)
      }
    }

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
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    return jsonWithRequestId({ id: data.id }, 201, requestId)
  } catch (error) {
    logger.error('resume-analyses POST failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}

export async function PATCH(req: Request) {
  const requestId = getRequestId(req)
  try {
    const { userId } = await auth()
    if (!userId) {
      return jsonWithRequestId({ error: clientErrorMessage('auth') }, 401, requestId)
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const parsed = resumeAnalysisPatchSchema.safeParse(rawBody)
    if (!parsed.success) {
      return jsonWithRequestId({ error: clientErrorMessage('invalid_input') }, 400, requestId)
    }

    const body = parsed.data
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
      return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
    }

    return jsonWithRequestId({ ok: true }, 200, requestId)
  } catch (error) {
    logger.error('resume-analyses PATCH failed', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return jsonWithRequestId({ error: clientErrorMessage('server') }, 500, requestId)
  }
}
