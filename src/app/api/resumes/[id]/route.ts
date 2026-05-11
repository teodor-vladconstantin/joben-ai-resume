import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { exceedsJsonBudget, updateResumeSchema, uuidLike } from '@/lib/validation/schemas'

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
      .from('resumes')
      .select('id, title, updated_at, score, data')
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Resumes table is missing in Supabase.'), 500)
      }
      // SECURITY: never echo Supabase error message; .single() returns
      // PGRST116 when no row matches which maps cleanly to 404.
      logger.error('resumes [id] GET failed', { userId, resumeId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('not_found'), 404)
    }

    return apiSuccess({ resume: data }, 200)
  } catch (error) {
    logger.error('resumes [id] GET top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const parsed = updateResumeSchema.safeParse(rawBody)
    if (!parsed.success) {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const body = parsed.data
    // SECURITY: cap resume JSON payload (anti storage abuse).
    if (body.data && exceedsJsonBudget(body.data)) {
      return apiError(clientErrorMessage('invalid_input', 'Resume payload is too large.'), 413)
    }

    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('resumes')
      .update({
        title: body.title,
        data: body.data,
      })
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .select('id, title, updated_at, score, data')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Resumes table is missing in Supabase.'), 500)
      }
      logger.error('resumes [id] PATCH failed', { userId, resumeId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ resume: data }, 200)
  } catch (error) {
    logger.error('resumes [id] PATCH top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
