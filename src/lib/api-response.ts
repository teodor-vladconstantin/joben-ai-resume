import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { jsonWithRequestId, logger } from '@/lib/logger'
import { createServerClient } from '@/lib/supabase/server'
import { clientErrorMessage } from '@/lib/security/client-error'
import { uuidLike } from '@/lib/validation/schemas'

export type ApiSuccess<T> = {
  success: true
  data: T
}

export type ApiFailure = {
  success: false
  error: string
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

export function apiSuccess<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(error: string, status = 400): NextResponse<ApiFailure> {
  return NextResponse.json({ success: false, error }, { status })
}

export function apiSuccessWithRequestId<T>(data: T, status: number, requestId: string): NextResponse {
  return jsonWithRequestId({ success: true, data }, status, requestId)
}

export function apiErrorWithRequestId(error: string, status: number, requestId: string): NextResponse {
  return jsonWithRequestId({ success: false, error }, status, requestId)
}

export function getErrorMessage(error: unknown, fallback = 'Internal server error'): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  if (typeof error === 'string' && error.trim().length > 0) {
    return error
  }

  return fallback
}

// --- Shared helpers for user-owned-resource CRUD routes ---
// (e.g. /api/resumes, /api/cover-letters). Extracted because the auth +
// ownership-check + Supabase error-branching shape is identical across those
// routes. Route-specific business logic (quotas, product events, transactional
// emails, etc.) stays inline in the route handlers — only the generic
// fetch/update/delete-by-owner plumbing lives here.

/**
 * Detects a Supabase/PostgREST "relation does not exist" error, which we treat
 * as a soft "table not provisioned yet" case rather than a hard failure.
 */
export function isMissingRelation(error: unknown): boolean {
  const err = error as { code?: string; message?: string }
  return err?.code === '42P01' || err?.code === 'PGRST205' || (err?.message || '').includes('relation')
}

export type OwnedResourceParams = { params: Promise<{ id: string }> }

/**
 * Auth + route `id` param validation for `/api/<resource>/[id]` routes. This
 * is the identical preamble across every GET/PATCH/DELETE handler on those
 * routes: require a signed-in user, then require the `id` param to look like
 * a valid identifier. Returns either the validated `{ userId, id }` pair or a
 * ready-to-return NextResponse (401/400) matching the exact prior inline behavior.
 */
export async function requireAuthenticatedResourceId(
  params: Promise<{ id: string }>
): Promise<{ ok: true; value: { userId: string; id: string } } | { ok: false; response: NextResponse }> {
  const { userId } = await auth()
  if (!userId) {
    return { ok: false, response: apiError(clientErrorMessage('auth'), 401) }
  }

  const { id } = await params
  const parsedId = uuidLike.safeParse(id)
  if (!parsedId.success) {
    return { ok: false, response: apiError(clientErrorMessage('invalid_input'), 400) }
  }

  return { ok: true, value: { userId, id: parsedId.data } }
}

type OwnedRowResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

/**
 * Fetches a list of rows owned by `userId` (`select ... where user_id = :userId
 * order by updated_at desc`). A missing table is treated as an empty list,
 * mirroring prior per-route behavior.
 */
export async function fetchOwnedList<T>(opts: {
  table: string
  columns: string
  userId: string
  logLabel: string
  logContext?: Record<string, unknown>
}): Promise<OwnedRowResult<T[]>> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from(opts.table)
    .select(opts.columns)
    .eq('user_id', opts.userId)
    .order('updated_at', { ascending: false })

  if (error) {
    if (isMissingRelation(error)) {
      return { ok: true, data: [] }
    }
    logger.error(opts.logLabel, { ...opts.logContext, error: error.message })
    return { ok: false, response: apiError(clientErrorMessage('server'), 500) }
  }

  return { ok: true, data: ((data as unknown) as T[]) || [] }
}

/**
 * Fetches a single row scoped to both `id` and `userId`. Non-missing-relation
 * errors map to 404 (matches prior GET-by-id behavior, since Supabase's
 * `.single()` surfaces "no rows" as an error too).
 */
export async function fetchOwnedRow<T>(opts: {
  table: string
  columns: string
  id: string
  userId: string
  missingRelationMessage: string
  logLabel: string
  logContext?: Record<string, unknown>
}): Promise<OwnedRowResult<T>> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from(opts.table)
    .select(opts.columns)
    .eq('id', opts.id)
    .eq('user_id', opts.userId)
    .single()

  if (error) {
    if (isMissingRelation(error)) {
      return { ok: false, response: apiError(clientErrorMessage('server', opts.missingRelationMessage), 500) }
    }
    logger.error(opts.logLabel, { ...opts.logContext, error: error.message })
    return { ok: false, response: apiError(clientErrorMessage('not_found'), 404) }
  }

  return { ok: true, data: data as T }
}

/**
 * Updates a single row scoped to both `id` and `userId`, returning the
 * updated row. Non-missing-relation errors map to 500 (matches prior
 * PATCH-by-id behavior).
 */
export async function updateOwnedRow<T>(opts: {
  table: string
  columns: string
  id: string
  userId: string
  update: Record<string, unknown>
  missingRelationMessage: string
  logLabel: string
  logContext?: Record<string, unknown>
}): Promise<OwnedRowResult<T>> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from(opts.table)
    .update(opts.update)
    .eq('id', opts.id)
    .eq('user_id', opts.userId)
    .select(opts.columns)
    .single()

  if (error) {
    if (isMissingRelation(error)) {
      return { ok: false, response: apiError(clientErrorMessage('server', opts.missingRelationMessage), 500) }
    }
    logger.error(opts.logLabel, { ...opts.logContext, error: error.message })
    return { ok: false, response: apiError(clientErrorMessage('server'), 500) }
  }

  return { ok: true, data: data as T }
}

/**
 * Deletes a single row scoped to both `id` and `userId` and returns the
 * final route response (`{ deleted: true }` on success, matching prior
 * DELETE-by-id/DELETE-by-query-param behavior).
 */
export async function deleteOwnedRow(opts: {
  table: string
  id: string
  userId: string
  missingRelationMessage: string
  logLabel: string
  logContext?: Record<string, unknown>
}): Promise<NextResponse> {
  const supabase = createServerClient()
  const { error } = await supabase
    .from(opts.table)
    .delete()
    .eq('id', opts.id)
    .eq('user_id', opts.userId)

  if (error) {
    if (isMissingRelation(error)) {
      return apiError(clientErrorMessage('server', opts.missingRelationMessage), 500)
    }
    logger.error(opts.logLabel, { ...opts.logContext, error: error.message })
    return apiError(clientErrorMessage('server'), 500)
  }

  return apiSuccess({ deleted: true }, 200)
}
