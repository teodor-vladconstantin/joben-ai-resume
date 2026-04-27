import { auth } from '@clerk/nextjs/server'
import { createServerClient } from '@/lib/supabase/server'
import { apiError, apiSuccess, getErrorMessage } from '@/lib/api-response'

function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('cover_letters')
      .select('id, title, content, updated_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Cover letters table is missing in Supabase.', 500)
      }
      return apiError(error.message, 404)
    }

    return apiSuccess({ letter: data }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const body = (await req.json()) as { title?: string; content?: string }
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('cover_letters')
      .update({
        title: body.title,
        content: body.content,
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, title, content, updated_at')
      .single()

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Cover letters table is missing in Supabase.', 500)
      }
      return apiError(error.message, 500)
    }

    return apiSuccess({ letter: data }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return apiError('Unauthorized', 401)
    }

    const { id } = await params
    const supabase = createServerClient()

    const { error } = await supabase
      .from('cover_letters')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      if (isMissingRelation(error)) {
        return apiError('Cover letters table is missing in Supabase.', 500)
      }
      return apiError(error.message, 500)
    }

    return apiSuccess({ deleted: true }, 200)
  } catch (error) {
    return apiError(getErrorMessage(error), 500)
  }
}
