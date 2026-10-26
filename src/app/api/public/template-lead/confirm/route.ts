import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, logger } from '@/lib/logger'
import { verifyTemplateLeadConfirmToken } from '@/lib/template-lead-confirm'
import { TEMPLATE_CONFIRM_COPY } from '@/lib/template-sequence-copy'
import { toAnonScanEmailLocale } from '@/lib/resend'

export const runtime = 'nodejs'

// SECURITY: double opt-in for the template-download list. The link in the
// confirmation email is bound (HMAC) to the lead id AND the exact address, so
// only the inbox owner can confirm. GET only renders a button and POST does
// the work, so mail link scanners that prefetch GETs cannot confirm for them.
const paramsSchema = z.object({
  leadId: z.string().uuid(),
  token: z.string().regex(/^[0-9a-f]{64}$/i),
})

function htmlPage(message: string, form?: { action: string; label: string }): NextResponse {
  const body = form
    ? `<form method="POST" action="${form.action}"><button type="submit" style="background:#2CB87A;color:#0A0A0A;border:0;padding:10px 16px;font-weight:700;cursor:pointer;">${form.label}</button></form>`
    : ''
  return new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Joben</title></head><body style="font-family:Arial,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#0D2818;"><p>${message}</p>${body}</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }
  )
}

async function loadLead(request: Request) {
  const url = new URL(request.url)
  const parsed = paramsSchema.safeParse({
    leadId: url.searchParams.get('leadId'),
    token: url.searchParams.get('token'),
  })
  if (!parsed.success) return null

  const supabase = createServerClient()
  const { data: lead } = await supabase
    .from('template_leads')
    .select('id, email, locale, marketing_consent, email_confirmed_at')
    .eq('id', parsed.data.leadId)
    .maybeSingle()

  if (!lead || !verifyTemplateLeadConfirmToken(lead.id, lead.email, parsed.data.token)) return null
  return { lead, supabase, leadId: parsed.data.leadId, token: parsed.data.token }
}

export async function GET(request: Request) {
  const loaded = await loadLead(request)
  if (!loaded) return htmlPage(TEMPLATE_CONFIRM_COPY.ro.pageInvalid)
  const copy = TEMPLATE_CONFIRM_COPY[toAnonScanEmailLocale(loaded.lead.locale)]
  if (loaded.lead.email_confirmed_at) return htmlPage(copy.pageAlready)

  return htmlPage(copy.pagePrompt, {
    action: `/api/public/template-lead/confirm?leadId=${loaded.leadId}&token=${loaded.token}`,
    label: copy.pageButton,
  })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const loaded = await loadLead(request)
  if (!loaded) return htmlPage(TEMPLATE_CONFIRM_COPY.ro.pageInvalid)
  const { lead, supabase } = loaded
  const copy = TEMPLATE_CONFIRM_COPY[toAnonScanEmailLocale(lead.locale)]

  if (lead.email_confirmed_at) return htmlPage(copy.pageAlready)

  const { error } = await supabase
    .from('template_leads')
    .update({ email_confirmed_at: new Date().toISOString() })
    .eq('id', lead.id)
    .eq('marketing_consent', true)
    .is('email_confirmed_at', null)

  if (error) {
    logger.error('Template lead confirm: update failed', { requestId, route: '/api/public/template-lead/confirm', error: error.message })
    return htmlPage('Something went wrong. Please try the link again in a moment.')
  }

  return htmlPage(copy.pageDone)
}
