import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient } from '@/lib/supabase/server'
import { getRequestId, logger } from '@/lib/logger'
import { verifyScanConfirmToken } from '@/lib/anonymous-scan-confirm'
import { sendAnonymousScanReportEmailIfEligible } from '@/lib/anonymous-scan-emails'
import { toAnonScanEmailLocale } from '@/lib/resend'

export const runtime = 'nodejs'

// SECURITY: double opt-in for the anonymous ATS checker. The link in the
// confirmation email is bound (HMAC) to the scan id AND the exact address, so
// only the inbox owner can confirm. GET only renders a button and POST does
// the work, so mail link scanners that prefetch GETs cannot confirm for them.
const paramsSchema = z.object({
  scanId: z.string().uuid(),
  token: z.string().regex(/^[0-9a-f]{64}$/i),
})

const reportJsonSchema = z.object({
  overall_score: z.number(),
  grade: z.string(),
  categories: z.object({
    ats_formatting: z.object({ score: z.number(), max: z.number() }),
    structure: z.object({ score: z.number(), max: z.number() }),
    keyword_impact: z.object({ score: z.number(), max: z.number() }),
    clarity: z.object({ score: z.number(), max: z.number() }),
  }),
  issues: z.array(z.object({ issue: z.string(), explanation: z.string() })),
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

const INVALID = 'This confirmation link is invalid or has expired.'

async function loadScan(request: Request) {
  const url = new URL(request.url)
  const parsed = paramsSchema.safeParse({
    scanId: url.searchParams.get('scanId'),
    token: url.searchParams.get('token'),
  })
  if (!parsed.success) return null

  const supabase = createServerClient()
  const { data: scan } = await supabase
    .from('anonymous_scans')
    .select('id, email, report_json, locale, posthog_distinct_id, email_confirmed_at')
    .eq('id', parsed.data.scanId)
    .maybeSingle()

  if (!scan || !verifyScanConfirmToken(scan.id, scan.email, parsed.data.token)) return null
  return { scan, supabase, scanId: parsed.data.scanId, token: parsed.data.token }
}

export async function GET(request: Request) {
  const loaded = await loadScan(request)
  if (!loaded) return htmlPage(INVALID)
  if (loaded.scan.email_confirmed_at) return htmlPage('Your email is already confirmed. Check your inbox for the report.')

  return htmlPage('Confirm that this email address is yours to receive your ATS score report.', {
    action: `/api/public/ats-check/confirm?scanId=${loaded.scanId}&token=${loaded.token}`,
    label: 'Confirm and send my report',
  })
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const loaded = await loadScan(request)
  if (!loaded) return htmlPage(INVALID)
  const { scan, supabase } = loaded

  if (scan.email_confirmed_at) return htmlPage('Your email is already confirmed. Check your inbox for the report.')

  const { error } = await supabase
    .from('anonymous_scans')
    .update({ email_confirmed_at: new Date().toISOString() })
    .eq('id', scan.id)
    .is('email_confirmed_at', null)

  if (error) {
    logger.error('ATS check confirm: update failed', { requestId, route: '/api/public/ats-check/confirm', error: error.message })
    return htmlPage('Something went wrong. Please try the link again in a moment.')
  }

  const report = reportJsonSchema.safeParse(scan.report_json)
  if (report.success && scan.email) {
    await sendAnonymousScanReportEmailIfEligible({
      scanId: scan.id,
      email: scan.email,
      locale: toAnonScanEmailLocale(scan.locale),
      analyticsDistinctId: scan.posthog_distinct_id ?? null,
      overallScore: report.data.overall_score,
      grade: report.data.grade,
      categories: report.data.categories,
      issues: report.data.issues,
    })
  }

  return htmlPage('Confirmed. Your ATS score report is on its way to your inbox.')
}
