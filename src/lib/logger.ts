import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export type LogLevel = 'info' | 'warn' | 'error'

type LogContext = Record<string, unknown>

const ALERT_WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL
const ALERT_MIN_LEVEL = (process.env.ALERT_MIN_LEVEL || 'error') as LogLevel

const LOG_SEVERITY: Record<LogLevel, number> = {
  info: 1,
  warn: 2,
  error: 3,
}

function shouldSendAlert(level: LogLevel): boolean {
  if (!ALERT_WEBHOOK_URL) return false
  return LOG_SEVERITY[level] >= LOG_SEVERITY[ALERT_MIN_LEVEL]
}

function sendAlert(payload: Record<string, unknown>) {
  if (!ALERT_WEBHOOK_URL) return

  // Fire-and-forget notification to avoid blocking request handling on alert transport.
  void fetch(ALERT_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Intentionally swallow alert transport errors to avoid recursive logging loops.
  })
}

function emit(level: LogLevel, message: string, context?: LogContext) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context || {}),
  }

  const line = JSON.stringify(payload)
  if (level === 'error') {
    console.error(line)
    // These are caught-and-handled errors (the client only ever sees the
    // sanitized clientErrorMessage()), so without this they never reach
    // Sentry and the real cause is unrecoverable after the fact.
    Sentry.captureMessage(message, { level: 'error', extra: context })
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.info(line)
  }

  if (shouldSendAlert(level)) {
    sendAlert(payload)
  }
}

export const logger = {
  info(message: string, context?: LogContext) {
    emit('info', message, context)
  },
  warn(message: string, context?: LogContext) {
    emit('warn', message, context)
  },
  error(message: string, context?: LogContext) {
    emit('error', message, context)
  },
}

export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || crypto.randomUUID()
}

export function withRequestId(response: Response, requestId: string): Response {
  response.headers.set('x-request-id', requestId)
  return response
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Metadata fields that the client UI relies on for nice error UX (quota
// modals, rate-limit banners, etc.). Preserve them through the error envelope
// instead of stripping everything except `error`.
const PRESERVED_ERROR_FIELDS = [
  'showUpgrade',
  'limit',
  'used',
  'remaining',
  'currentPlan',
  'limitType',
  'feature',
  'retryAfter',
] as const

function pickPreservedErrorFields(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of PRESERVED_ERROR_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key]
  }
  return out
}

function normalizeApiPayload(data: unknown, status: number): unknown {
  if (isRecord(data) && typeof data.success === 'boolean') {
    if (data.success) {
      if ('data' in data) {
        return data
      }

      const rest = { ...data }
      delete rest.success
      return { success: true, data: rest, ...rest }
    }

    return {
      success: false,
      error: typeof data.error === 'string' && data.error.trim().length > 0 ? data.error : 'Request failed',
      ...pickPreservedErrorFields(data),
    }
  }

  if (status >= 400) {
    if (isRecord(data) && typeof data.error === 'string' && data.error.trim().length > 0) {
      return { success: false, error: data.error, ...pickPreservedErrorFields(data) }
    }
    return { success: false, error: 'Request failed' }
  }

  if (isRecord(data)) {
    return { success: true, data, ...data }
  }

  return { success: true, data }
}

export function jsonWithRequestId(data: unknown, status: number, requestId: string): NextResponse {
  const response = NextResponse.json(normalizeApiPayload(data, status), { status })
  response.headers.set('x-request-id', requestId)
  return response
}
