import { NextResponse } from 'next/server'
import { jsonWithRequestId } from '@/lib/logger'

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
