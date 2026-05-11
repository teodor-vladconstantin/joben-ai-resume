import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess } from '@/lib/api-response'
import { logger } from '@/lib/logger'
import { clientErrorMessage } from '@/lib/security/client-error'
import { updateCoverLetterSchema, uuidLike } from '@/lib/validation/schemas'

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
      .from('cover_letters')
      .select('id, title, content, updated_at')
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Cover letters table is missing in Supabase.'), 500)
      }
      logger.error('cover-letters [id] GET failed', { userId, letterId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('not_found'), 404)
    }

    return apiSuccess({ letter: data }, 200)
  } catch (error) {
    logger.error('cover-letters [id] GET top-level failure', {
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

    const parsed = updateCoverLetterSchema.safeParse(rawBody)
    if (!parsed.success) {
      return apiError(clientErrorMessage('invalid_input'), 400)
    }

    const body = parsed.data
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('cover_letters')
      .update({
        title: body.title,
        content: body.content,
      })
      .eq('id', parsedId.data)
      .eq('user_id', userId)
      .select('id, title, content, updated_at')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Cover letters table is missing in Supabase.'), 500)
      }
      logger.error('cover-letters [id] PATCH failed', { userId, letterId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ letter: data }, 200)
  } catch (error) {
    logger.error('cover-letters [id] PATCH top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', parsedId.data)
      .eq('user_id', userId)

    if (error) {
      if (isMissingRelation(error)) {
        return apiError(clientErrorMessage('server', 'Cover letters table is missing in Supabase.'), 500)
      }
      logger.error('cover-letters [id] DELETE failed', { userId, letterId: parsedId.data, error: error.message })
      return apiError(clientErrorMessage('server'), 500)
    }

    return apiSuccess({ deleted: true }, 200)
  } catch (error) {
    logger.error('cover-letters [id] DELETE top-level failure', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return apiError(clientErrorMessage('server'), 500)
  }
}
