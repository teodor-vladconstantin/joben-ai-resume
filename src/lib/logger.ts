import { NextResponse } from 'next/server'

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
  } else if (level === 'warn') {
    console.warn(line)
  } else {
    console.log(line)
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

export function jsonWithRequestId(data: unknown, status: number, requestId: string): NextResponse {
  const response = NextResponse.json(data, { status })
  response.headers.set('x-request-id', requestId)
  return response
}
