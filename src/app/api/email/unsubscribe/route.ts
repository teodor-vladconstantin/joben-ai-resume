import { NextResponse } from 'next/server'
import { verifyUnsubscribeToken } from '@/lib/email-unsubscribe-token'
import { suppressEmail } from '@/lib/email-suppression'
import { getRequestId, logger } from '@/lib/logger'

export const runtime = 'nodejs'

// SECURITY: intentionally public, no Clerk auth — this is the link every
// automated email includes in its footer, and the target of the
// `List-Unsubscribe-Post: List-Unsubscribe=One-Click` header mail clients
// (Gmail, Yahoo, etc.) POST to automatically. The HMAC token (see
// email-unsubscribe-token.ts) is what prevents someone else's address being
// unsubscribed via a guessed URL, not auth.
function htmlPage(message: string): NextResponse {
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Joben</title></head><body style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#0D2818;"><p>${message}</p></body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

async function handleUnsubscribe(request: Request): Promise<NextResponse> {
  const requestId = getRequestId(request)
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  const token = url.searchParams.get('token')

  if (!verifyUnsubscribeToken(email, token)) {
    return htmlPage('This unsubscribe link is invalid or has expired.')
  }

  await suppressEmail(email as string, 'unsubscribe_link')

  logger.info('Email unsubscribed', { requestId, route: '/api/email/unsubscribe' })

  return htmlPage("You're unsubscribed. You won't get any more emails like this from Joben.")
}

export async function GET(request: Request) {
  return handleUnsubscribe(request)
}

// One-click unsubscribe (RFC 8058): mail clients POST here directly from the
// List-Unsubscribe-Post header, with no page render involved.
export async function POST(request: Request) {
  return handleUnsubscribe(request)
}
