import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { updateCoverLetterSchema } from '@/lib/validation/schemas'
import {
  apiError,
  apiSuccess,
  deleteOwnedRow,
  fetchOwnedRow,
  requireAuthenticatedResourceId,
  updateOwnedRow,
} from '@/lib/api-response'

type CoverLetterRow = {
  id: string
  title: string | null
  content: string | null
  updated_at: string
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthenticatedResourceId(params)
    if (!authResult.ok) return authResult.response
    const { userId, id } = authResult.value

    const result = await fetchOwnedRow<CoverLetterRow>({
      table: 'cover_letters',
      columns: 'id, title, content, updated_at',
      id,
      userId,
      missingRelationMessage: 'Cover letters table is missing in Supabase.',
      logLabel: 'cover-letters [id] GET failed',
      logContext: { userId, letterId: id },
    })

    if (!result.ok) return result.response

    return apiSuccess({ letter: result.data }, 200)
  } catch (error) {
    logger.error('cover-letters [id] GET top-level failure', {
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

    const parsed = updateCoverLetterSchema.safeParse(rawBody)
    if (!parsed.success) {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const body = parsed.data

    const result = await updateOwnedRow<CoverLetterRow>({
      table: 'cover_letters',
      columns: 'id, title, content, updated_at',
      id,
      userId,
      update: {
        title: body.title,
        content: body.content,
      },
      missingRelationMessage: 'Cover letters table is missing in Supabase.',
      logLabel: 'cover-letters [id] PATCH failed',
      logContext: { userId, letterId: id },
    })

    if (!result.ok) return result.response

    return apiSuccess({ letter: result.data }, 200)
  } catch (error) {
    logger.error('cover-letters [id] PATCH top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireAuthenticatedResourceId(params)
    if (!authResult.ok) return authResult.response
    const { userId, id } = authResult.value

    return await deleteOwnedRow({
      table: 'cover_letters',
      id,
      userId,
      missingRelationMessage: 'Cover letters table is missing in Supabase.',
      logLabel: 'cover-letters [id] DELETE failed',
      logContext: { userId, letterId: id },
    })
  } catch (error) {
    logger.error('cover-letters [id] DELETE top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
