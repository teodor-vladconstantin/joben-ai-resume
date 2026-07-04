import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { exceedsJsonBudget, updateResumeSchema } from '@/lib/validation/schemas'
import {
  apiError,
  apiSuccess,
  fetchOwnedRow,
  requireAuthenticatedResourceId,
  updateOwnedRow,
} from '@/lib/api-response'

type ResumeRow = {
  id: string
  title: string | null
  updated_at: string
  score: number | null
  data: unknown
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthenticatedResourceId(params)
    if (!authResult.ok) return authResult.response
    const { userId, id } = authResult.value

    const result = await fetchOwnedRow<ResumeRow>({
      table: 'resumes',
      columns: 'id, title, updated_at, score, data',
      id,
      userId,
      missingRelationMessage: 'Resumes table is missing in Supabase.',
      // SECURITY: never echo Supabase error message; .single() returns
      // PGRST116 when no row matches which maps cleanly to 404.
      logLabel: 'resumes [id] GET failed',
      logContext: { userId, resumeId: id },
    })

    if (!result.ok) return result.response

    return apiSuccess({ resume: result.data }, 200)
  } catch (error) {
    logger.error('resumes [id] GET top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthenticatedResourceId(params)
    if (!authResult.ok) return authResult.response
    const { userId, id } = authResult.value

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

    const result = await updateOwnedRow<ResumeRow>({
      table: 'resumes',
      columns: 'id, title, updated_at, score, data',
      id,
      userId,
      update: {
        title: body.title,
        data: body.data,
      },
      missingRelationMessage: 'Resumes table is missing in Supabase.',
      logLabel: 'resumes [id] PATCH failed',
      logContext: { userId, resumeId: id },
    })

    if (!result.ok) return result.response

    return apiSuccess({ resume: result.data }, 200)
  } catch (error) {
    logger.error('resumes [id] PATCH top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
