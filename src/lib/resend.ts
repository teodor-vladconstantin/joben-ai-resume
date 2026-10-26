import { Resend } from 'resend'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { isUnsubscribeConfigured, signUnsubscribeToken } from '@/lib/email-unsubscribe-token'
import { signTemplateLeadConfirmToken } from '@/lib/template-lead-confirm'
import {
  TEMPLATE_CONFIRM_COPY,
  TEMPLATE_SEQUENCE_COPY,
  TEMPLATE_SEQUENCE_FOOTER,
  type TemplateSequenceStep,
} from '@/lib/template-sequence-copy'
import { logger } from '@/lib/logger'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Joben <onboarding@resend.dev>'
const automationFromEmail = 'Joben <no-reply@joben.eu>'
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function getResendClient() {
  if (!resendApiKey) return null
  return new Resend(resendApiKey)
}

type EmailResult = {
  success: boolean
  error?: string
  providerId?: string
  // true when nothing was sent because the recipient unsubscribed: still a
  // success (nothing to retry or alert on), but not a delivered email.
  suppressed?: boolean
}

type ResendResponse = {
  data?: {
    id?: string
  } | null
  error?: {
    message?: string
  } | null
}

// Every automated email in this file funnels through here, so this is the
// single place that (a) guarantees a working unsubscribe link is present and
// (b) honors it. No individual template is responsible for remembering
// either — see the src/lib/resend.ts entry in RUNBOOK.md.
async function sendEmail(input: {
  from: string
  to: string
  subject: string
  html: string
  unsubscribeLabel?: string
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) {
    // Silent no-op, same as before: RESEND_API_KEY absent (local dev/CI) means
    // sending was never going to happen, so this isn't a real misconfiguration.
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  // Fails closed: an automated email with no way to opt out is a compliance
  // gap, not just a missing feature, so a deployment that's actually able to
  // send (RESEND_API_KEY present) must not do so without this configured
  // (unlike most of this codebase's fail-open checks). Checked after the
  // RESEND_API_KEY check above so local dev/CI without either var stays a
  // silent no-op instead of paging Sentry on every run.
  if (!isUnsubscribeConfigured()) {
    logger.error('Email send blocked: EMAIL_UNSUBSCRIBE_SECRET is not configured', {
      source: 'sendEmail',
    })
    return { success: false, error: 'EMAIL_UNSUBSCRIBE_SECRET is not configured.' }
  }

  let suppressed: boolean
  try {
    suppressed = await isEmailSuppressed(input.to)
  } catch (error) {
    // Cannot confirm the recipient has not opted out: do not send, and report a
    // failure so cron callers retry on their next run.
    logger.warn('Email suppression check unavailable; not sending', {
      source: 'sendEmail',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return { success: false, error: 'Email suppression check is unavailable.' }
  }

  if (suppressed) {
    // Not a failure: the recipient opted out, so "not delivered" is the
    // correct outcome, not something callers should retry or alert on.
    return { success: true, suppressed: true }
  }

  const token = signUnsubscribeToken(input.to)
  if (!token) {
    return { success: false, error: 'Could not build an unsubscribe link for this address.' }
  }
  const unsubscribeUrl = `${appUrl}/api/email/unsubscribe?email=${encodeURIComponent(input.to)}&token=${token}`
  const htmlWithFooter = `${input.html}
<p style="margin-top:16px;text-align:center;"><a href="${unsubscribeUrl}" style="color:#5C5C57;font-size:12px;text-decoration:underline;">${input.unsubscribeLabel || 'Unsubscribe from these emails'}</a></p>`

  try {
    const response = (await client.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: htmlWithFooter,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    })) as ResendResponse

    if (response.error) {
      return { success: false, error: response.error.message || 'Resend send failed.' }
    }

    return { success: true, providerId: response.data?.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function sendWelcomeEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: fromEmail,
    to: input.to,
    subject: 'Welcome to Joben',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Welcome to Joben, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">Your account is ready. Start building ATS-optimized resumes and cover letters in minutes.</p>
  <p style="margin:0 0 18px 0;">You can also run an AI review to identify quick wins before your next application.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Open Dashboard</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">You are receiving this because you created a Joben account.</p>
</div>`,
  })
}

export async function sendSevenDayFollowupEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: fromEmail,
    to: input.to,
    subject: '7-day check-in: boost your resume outcomes',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">One-week check-in, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">If you have not done it yet, run one AI review and tailor one resume to a target role.</p>
  <p style="margin:0 0 18px 0;">These two steps usually produce the biggest quality jump in less than 10 minutes.</p>
  <a href="${appUrl}/ai-review" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Run AI Review</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">Need help? Reply to this email and we will point you to the fastest workflow.</p>
</div>`,
  })
}

export async function sendFirstResumeEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: 'Your first resume is ready',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Nice work, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">Your first resume is now in Joben. Keep refining it or export a clean PDF anytime.</p>
  <p style="margin:0 0 18px 0;">Ready to share it? Head to your dashboard and export the PDF in one click.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Open Dashboard</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">You are receiving this because you created a resume on Joben.</p>
</div>`,
  })
}

export async function sendInactivityEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: 'Your Joben resume is waiting',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Quick reminder, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">You created a Joben account recently, and your resume is still waiting for you.</p>
  <p style="margin:0 0 18px 0;">Jump back in to generate your resume in minutes and export a PDF when ready.</p>
  <a href="${appUrl}/resumes/new" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Generate Resume</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">If you already finished, you can ignore this email.</p>
</div>`,
  })
}

export type AtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'

// Anonymous ATS-checker emails are localized from anonymous_scans.locale.
// The account emails in this file stay English (users has no locale yet).
export type AnonScanEmailLocale = 'ro' | 'en'
export type AnonScanEmailType = 'report' | '48h' | '7d'

// Rows scanned before the locale column existed have NULL: default to 'ro',
// the site's default locale.
export function toAnonScanEmailLocale(value: string | null | undefined): AnonScanEmailLocale {
  return value === 'en' ? 'en' : 'ro'
}

// Issue text comes from the model reading user-supplied CV text, so it is
// escaped before going into HTML.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// `scan` is read by the sign-up page to claim the scan into the new account;
// utm_* is picked up by PostHog on landing.
export function anonScanCtaUrl(locale: AnonScanEmailLocale, type: AnonScanEmailType, scanId: string): string {
  const params = new URLSearchParams({
    utm_source: 'email',
    utm_campaign: `anon_scan_${type}`,
    scan: scanId,
  })
  return `${appUrl}/${locale}/sign-up?${params.toString()}`
}

function anonCtaButton(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">${label}</a>`
}

const CATEGORY_LABELS: Record<AnonScanEmailLocale, Record<AtsCategoryKey, string>> = {
  en: {
    ats_formatting: 'ATS Formatting',
    structure: 'Structure',
    keyword_impact: 'Keywords & Impact',
    clarity: 'Clarity',
  },
  ro: {
    ats_formatting: 'Formatare ATS',
    structure: 'Structură',
    keyword_impact: 'Cuvinte Cheie & Impact',
    clarity: 'Claritate',
  },
}

// Same labels as messages/ro.json Grade.labels.
const GRADE_LABELS_RO: Record<string, string> = {
  Critical: 'Critic',
  Poor: 'Slab',
  Fair: 'Acceptabil',
  Good: 'Bun',
  Excellent: 'Excelent',
  Outstanding: 'Remarcabil',
}

const ANON_FOOTER: Record<AnonScanEmailLocale, string> = {
  en: 'You are receiving this because you requested your ATS score report on joben.eu.',
  ro: 'Primești acest email pentru că ai cerut raportul scorului ATS pe joben.eu.',
}

const UNSUBSCRIBE_LABEL: Record<AnonScanEmailLocale, string> = {
  en: 'Unsubscribe from these emails',
  ro: 'Dezabonează-te de la aceste emailuri',
}

const REPORT_COPY: Record<AnonScanEmailLocale, {
  subject: (score: number) => string
  heading: (score: number, grade: string) => string
  intro: string
  topFixes: string
  cta: string
}> = {
  en: {
    subject: (score) => `Your resume scored ${score}/100: here's what to fix`,
    heading: (score, grade) => `Your resume scored ${score}/100 (${grade}).`,
    intro: 'Here is the category breakdown from your free ATS scan:',
    topFixes: 'Top things to fix:',
    cta: 'Fix It Free with Joben',
  },
  ro: {
    subject: (score) => `CV-ul tău a obținut ${score}/100: iată ce ai de reparat`,
    heading: (score, grade) => `CV-ul tău a obținut ${score}/100 (${grade}).`,
    intro: 'Iată scorurile pe categorii din scanarea ATS gratuită:',
    topFixes: 'Ce să repari mai întâi:',
    cta: 'Repară-l gratuit cu Joben',
  },
}

export async function sendAnonymousScanReportEmail(input: {
  to: string
  scanId: string
  locale: AnonScanEmailLocale
  overallScore: number
  grade: string
  categories: Record<AtsCategoryKey, { score: number; max: number }>
  issues: { issue: string; explanation: string }[]
}): Promise<EmailResult> {
  const copy = REPORT_COPY[input.locale]
  const labels = CATEGORY_LABELS[input.locale]
  const grade = input.locale === 'ro' ? GRADE_LABELS_RO[input.grade] || input.grade : input.grade

  const categoryRows = (Object.keys(labels) as AtsCategoryKey[])
    .map((key) => `<li style="margin:0 0 4px 0;">${labels[key]}: ${input.categories[key].score}/${input.categories[key].max}</li>`)
    .join('')

  const issueRows = input.issues
    .slice(0, 3)
    .map((item) => `<li style="margin:0 0 10px 0;"><strong>${escapeHtml(item.issue)}</strong><br/><span style="color:#5C5C57;font-size:13px;">${escapeHtml(item.explanation)}</span></li>`)
    .join('')

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject(input.overallScore),
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${escapeHtml(copy.heading(input.overallScore, grade))}</h1>
  <p style="margin:0 0 12px 0;">${copy.intro}</p>
  <ul style="margin:0 0 18px 18px;padding:0;">${categoryRows}</ul>
  ${issueRows ? `<p style="margin:0 0 8px 0;">${copy.topFixes}</p><ul style="margin:0 0 18px 18px;padding:0;">${issueRows}</ul>` : ''}
  ${anonCtaButton(anonScanCtaUrl(input.locale, 'report', input.scanId), copy.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${ANON_FOOTER[input.locale]}</p>
</div>`,
  })
}

const CATEGORY_48H_COPY: Record<AnonScanEmailLocale, Record<AtsCategoryKey, { subject: string; body: string }>> = {
  en: {
    keyword_impact: {
      subject: 'Your resume is missing the numbers recruiters scan for',
      body: 'Your ATS scan flagged Keywords & Impact as the weakest section: bullets without concrete numbers or outcomes read as junior, even when the work behind them was not.',
    },
    clarity: {
      subject: 'Your resume bullets could be sharper',
      body: 'Your ATS scan flagged Clarity as the weakest section: dense or vague bullets make recruiters skim past real accomplishments.',
    },
    structure: {
      subject: "Your resume's structure is working against you",
      body: 'Your ATS scan flagged Structure as the weakest section: missing or misordered sections make ATS software misread your experience.',
    },
    ats_formatting: {
      subject: 'Your resume format may be tripping up ATS software',
      body: 'Your ATS scan flagged ATS Formatting as the weakest section: layout choices like tables or graphics can cause parsers to drop content entirely.',
    },
  },
  ro: {
    keyword_impact: {
      subject: 'CV-ului tău îi lipsesc cifrele pe care le caută recrutorii',
      body: 'Scanarea ATS a arătat că secțiunea Cuvinte Cheie & Impact e cea mai slabă: punctele fără cifre sau rezultate concrete par de nivel junior, chiar dacă munca din spatele lor valorează mult mai mult.',
    },
    clarity: {
      subject: 'Punctele din CV-ul tău pot fi mai clare',
      body: 'Scanarea ATS a arătat că secțiunea Claritate e cea mai slabă: punctele dense sau vagi îi fac pe recrutori să treacă în grabă peste realizări reale.',
    },
    structure: {
      subject: 'Structura CV-ului tău lucrează împotriva ta',
      body: 'Scanarea ATS a arătat că secțiunea Structură e cea mai slabă: secțiunile lipsă sau așezate în altă ordine fac software-ul ATS să îți citească greșit experiența.',
    },
    ats_formatting: {
      subject: 'Formatul CV-ului tău poate încurca software-ul ATS',
      body: 'Scanarea ATS a arătat că secțiunea Formatare ATS e cea mai slabă: elemente de layout precum tabelele sau graficele pot face parserele să piardă conținut cu totul.',
    },
  },
}

const FOLLOWUP_48H_COPY: Record<AnonScanEmailLocale, {
  fallbackSubject: string
  heading: string
  fallbackBody: string
  pitch: string
  cta: string
}> = {
  en: {
    fallbackSubject: 'Still want to fix what your resume scan found?',
    heading: 'A couple of days ago you scanned your resume on Joben.',
    fallbackBody: 'Your ATS scan found a few things worth fixing before your next application.',
    pitch: 'A free Joben account gives you AI-guided rewrites and an ATS-optimized template to fix it in minutes.',
    cta: 'Fix My Resume Free',
  },
  ro: {
    fallbackSubject: 'Mai vrei să repari ce a găsit scanarea CV-ului tău?',
    heading: 'Acum două zile ți-ai scanat CV-ul pe Joben.',
    fallbackBody: 'Scanarea ATS a găsit câteva lucruri de reparat înainte de următoarea aplicare.',
    pitch: 'Un cont Joben gratuit îți oferă rescrieri ghidate de AI și un șablon optimizat ATS ca să le repari în câteva minute.',
    cta: 'Repară-mi CV-ul gratuit',
  },
}

export async function sendAnonymousScan48hEmail(input: {
  to: string
  scanId: string
  locale: AnonScanEmailLocale
  weakestCategory: AtsCategoryKey | null
}): Promise<EmailResult> {
  const base = FOLLOWUP_48H_COPY[input.locale]
  const copy = input.weakestCategory ? CATEGORY_48H_COPY[input.locale][input.weakestCategory] : null

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy?.subject || base.fallbackSubject,
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${base.heading}</h1>
  <p style="margin:0 0 12px 0;">${copy?.body || base.fallbackBody}</p>
  <p style="margin:0 0 18px 0;">${base.pitch}</p>
  ${anonCtaButton(anonScanCtaUrl(input.locale, '48h', input.scanId), base.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${ANON_FOOTER[input.locale]}</p>
</div>`,
  })
}

// Numbers match the free plan in src/lib/ratelimit.ts (jds 3, bullets 15, covers 3).
const FOLLOWUP_7D_COPY: Record<AnonScanEmailLocale, {
  subject: string
  heading: string
  body: string
  cta: string
  lastReminder: string
}> = {
  en: {
    subject: 'Still on the job hunt?',
    heading: 'No pressure, just leaving this here.',
    body: 'A week ago you ran a free ATS scan on Joben. If you are still applying, a free account gives you 3 AI resume tailorings, 15 bullet rewrites and 3 cover letters every month.',
    cta: 'Create a Free Account',
    lastReminder: 'This is the last reminder in this series.',
  },
  ro: {
    subject: 'Încă îți cauți un job?',
    heading: 'Fără presiune, doar îți lăsăm asta aici.',
    body: 'Acum o săptămână ai făcut o scanare ATS gratuită pe Joben. Dacă încă aplici, un cont gratuit îți oferă în fiecare lună 3 adaptări AI ale CV-ului, 15 rescrieri de puncte și 3 scrisori de intenție.',
    cta: 'Creează un cont gratuit',
    lastReminder: 'Acesta e ultimul memento din serie.',
  },
}

export async function sendAnonymousScan7dEmail(input: {
  to: string
  scanId: string
  locale: AnonScanEmailLocale
}): Promise<EmailResult> {
  const copy = FOLLOWUP_7D_COPY[input.locale]

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject,
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  <p style="margin:0 0 12px 0;">${copy.body}</p>
  ${anonCtaButton(anonScanCtaUrl(input.locale, '7d', input.scanId), copy.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${ANON_FOOTER[input.locale]} ${copy.lastReminder}</p>
</div>`,
  })
}

const PASS_DAY10_COPY: Record<AnonScanEmailLocale, {
  subject: (days: number) => string
  heading: string
  body: (days: number) => string
  pitch: string
  cta: string
}> = {
  en: {
    subject: (days) => `Your Interview Pass ends in ${days} ${days === 1 ? 'day' : 'days'}`,
    heading: 'Keep your Pro tools while you apply.',
    body: (days) => `Your 14-day Interview Pass has ${days} ${days === 1 ? 'day' : 'days'} left. After that your account returns to the free plan.`,
    pitch: 'Pro is 59 RON per month and you can cancel any time. Your resumes, tailored versions and cover letters stay exactly where they are.',
    cta: 'See Pro',
  },
  ro: {
    subject: (days) => `Pass-ul tău de Interviu se încheie în ${days} ${days === 1 ? 'zi' : 'zile'}`,
    heading: 'Păstrează uneltele Pro cât timp aplici.',
    body: (days) => `Pass-ul tău de Interviu de 14 zile mai are ${days} ${days === 1 ? 'zi' : 'zile'}. După aceea contul revine la planul gratuit.`,
    pitch: 'Pro costă 59 RON pe lună și îl poți anula oricând. CV-urile, versiunile adaptate și scrisorile tale rămân exact unde sunt.',
    cta: 'Vezi Pro',
  },
}

export async function sendPassDay10Email(input: {
  to: string
  locale: AnonScanEmailLocale
  daysLeft: number
}): Promise<EmailResult> {
  const copy = PASS_DAY10_COPY[input.locale]
  const href = `${appUrl}/${input.locale}/pricing?utm_source=email&utm_medium=lifecycle&utm_campaign=pass_day10`

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject(input.daysLeft),
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  <p style="margin:0 0 12px 0;">${copy.body(input.daysLeft)}</p>
  <p style="margin:0 0 18px 0;">${copy.pitch}</p>
  ${anonCtaButton(href, copy.cta)}
</div>`,
  })
}

// Double opt-in mail for the template-download list: the sequence only starts
// once the inbox owner confirms (see /api/public/template-lead/confirm).
export async function sendTemplateLeadConfirmEmail(input: {
  to: string
  leadId: string
  locale: AnonScanEmailLocale
}): Promise<EmailResult> {
  const copy = TEMPLATE_CONFIRM_COPY[input.locale]
  const token = signTemplateLeadConfirmToken(input.leadId, input.to)
  if (!token) return { success: false, error: 'Could not build a confirmation link for this address.' }
  const href = `${appUrl}/api/public/template-lead/confirm?leadId=${input.leadId}&token=${token}`

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject,
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  <p style="margin:0 0 18px 0;">${copy.body}</p>
  ${anonCtaButton(href, copy.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${copy.footer}</p>
</div>`,
  })
}

export async function sendTemplateSequenceEmail(input: {
  to: string
  step: TemplateSequenceStep
  locale: AnonScanEmailLocale
}): Promise<EmailResult> {
  const copy = TEMPLATE_SEQUENCE_COPY[input.locale][input.step]
  const params = new URLSearchParams({
    utm_source: 'email',
    utm_medium: 'lifecycle',
    utm_campaign: `template_seq_${input.step}`,
  })
  const href = `${appUrl}/${input.locale}${copy.ctaPath}?${params.toString()}`

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject,
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  ${copy.body.map((paragraph) => `<p style="margin:0 0 12px 0;">${paragraph}</p>`).join('\n  ')}
  ${anonCtaButton(href, copy.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${TEMPLATE_SEQUENCE_FOOTER[input.locale]}</p>
</div>`,
  })
}

export async function sendExportFollowupEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: 'Applied with that resume? A few things worth checking',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">A couple of weeks ago you exported a resume, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">Most applications take two to three weeks to get any response, so a quiet inbox right now is expected.</p>
  <p style="margin:0 0 18px 0;">While you wait: tailoring the same resume to each specific job posting is the single biggest lever for getting past the initial screen. If you're applying somewhere new, it takes a couple of minutes.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Tailor for Another Role</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">If you already heard back either way, you can ignore this. This is the only email you'll get about this export.</p>
</div>`,
  })
}

export async function sendRateLimitEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'there'

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: 'You reached the free plan limit',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Heads up, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">You just reached a free plan limit on Joben.</p>
  <p style="margin:0 0 18px 0;">Upgrade to Pro to unlock:</p>
  <ul style="margin:0 0 18px 18px;padding:0;">
    <li>Save up to 3 CVs and unlimited PDF exports</li>
    <li>Much higher AI limits for reviews and rewrites</li>
    <li>Priority support when you need help</li>
  </ul>
  <a href="${appUrl}/pricing" style="display:inline-block;background:#2CB87A;color:#0A0A0A;text-decoration:none;padding:10px 16px;border-radius:0;font-weight:700;">Upgrade to Pro</a>
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">Thanks for building with Joben.</p>
</div>`,
  })
}

const REFERRAL_REWARD_COPY: Record<AnonScanEmailLocale, {
  subject: (days: number) => string
  heading: string
  body: (days: number, date: string) => string
  bodySubscribed: (days: number) => string
  remaining: (count: number) => string
  limitReached: string
  cta: string
  footer: string
  dateLocale: string
}> = {
  ro: {
    subject: (days) => `Ai primit ${days} zile Pro pe Joben`,
    heading: 'Un prieten s-a alăturat prin linkul tău',
    body: (days, date) => `Ți-am adăugat ${days} zile de acces Pro. Contul tău are Pro până pe ${date}.`,
    bodySubscribed: (days) =>
      `Ți-am adăugat ${days} zile de acces Pro. Zilele sunt salvate și se aplică după ce se încheie abonamentul tău.`,
    remaining: (count) =>
      count === 1 ? 'Mai poți primi recompensă pentru încă un prieten.' : `Mai poți primi recompense pentru încă ${count} prieteni.`,
    limitReached: 'Ai atins numărul maxim de recompense din programul de recomandare. Mulțumim că ai recomandat Joben.',
    cta: 'Deschide dashboard-ul',
    footer: 'Primești acest email pentru că un prieten și-a creat cont Joben prin linkul tău de recomandare.',
    dateLocale: 'ro-RO',
  },
  en: {
    subject: (days) => `You earned ${days} days of Joben Pro`,
    heading: 'A friend joined through your link',
    body: (days, date) => `We added ${days} days of Pro access. Your account has Pro until ${date}.`,
    bodySubscribed: (days) => `We added ${days} days of Pro access. The days are saved and apply after your subscription ends.`,
    remaining: (count) =>
      count === 1 ? 'You can earn a reward for one more friend.' : `You can earn rewards for ${count} more friends.`,
    limitReached: 'You have reached the maximum number of referral rewards. Thank you for recommending Joben.',
    cta: 'Open your dashboard',
    footer: 'You are receiving this because a friend created a Joben account through your referral link.',
    dateLocale: 'en-GB',
  },
}

export async function sendReferralRewardEmail(input: {
  to: string
  locale: AnonScanEmailLocale
  days: number
  proUntil: string
  // A subscription or Recruiting shadows the grant, so no "Pro until" date.
  hasSubscription: boolean
  remainingRewards: number
}): Promise<EmailResult> {
  const copy = REFERRAL_REWARD_COPY[input.locale]
  const date = new Date(input.proUntil).toLocaleDateString(copy.dateLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  })
  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy.subject(input.days),
    unsubscribeLabel: UNSUBSCRIBE_LABEL[input.locale],
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  <p style="margin:0 0 12px 0;">${escapeHtml(input.hasSubscription ? copy.bodySubscribed(input.days) : copy.body(input.days, date))}</p>
  <p style="margin:0 0 18px 0;">${input.remainingRewards > 0 ? copy.remaining(input.remainingRewards) : copy.limitReached}</p>
  ${anonCtaButton(`${appUrl}/${input.locale}/dashboard`, copy.cta)}
  <p style="margin-top:18px;color:#5C5C57;font-size:13px;">${copy.footer}</p>
</div>`,
  })
}

const MOBILE_HANDOFF_COPY: Record<AnonScanEmailLocale, {
  subject: string
  heading: string
  body: string
  cta: string
}> = {
  ro: {
    subject: 'Continuă CV-ul pe laptop',
    heading: 'Editorul Joben merge cel mai bine pe laptop',
    body: 'Deschide linkul de mai jos pe laptop. Contul și scanarea ATS te așteaptă acolo, iar editorul are tot spațiul de care ai nevoie.',
    cta: 'Deschide dashboard-ul',
  },
  en: {
    subject: 'Continue your CV on a laptop',
    heading: 'The Joben editor works best on a laptop',
    body: 'Open the link below on your laptop. Your account and ATS scan are waiting there, and the editor has all the room you need.',
    cta: 'Open your dashboard',
  },
}

// Sent when a signed-in user asks for it from the dashboard on a small screen,
// so it goes straight to their own address and skips the marketing suppression
// list on purpose (a requested link, not a campaign).
export async function sendMobileHandoffEmail(input: {
  to: string
  locale: AnonScanEmailLocale
}): Promise<EmailResult> {
  const copy = MOBILE_HANDOFF_COPY[input.locale]
  const href = `${appUrl}/${input.locale}/dashboard?utm_source=email&utm_medium=handoff&utm_campaign=mobile_handoff`
  return sendTransactionalEmail({
    to: input.to,
    subject: copy.subject,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">${copy.heading}</h1>
  <p style="margin:0 0 18px 0;">${copy.body}</p>
  ${anonCtaButton(href, copy.cta)}
</div>`,
  })
}

// Legally required transactional messages (e.g. the inactive-account warning). These
// skip sendEmail on purpose: they must reach the consumer even if the address
// is on the marketing suppression list, and carry no unsubscribe footer.
export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  html: string
  replyTo?: string
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) return { success: false, error: 'RESEND_API_KEY is not configured.' }
  try {
    const response = (await client.emails.send({
      from: automationFromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: input.replyTo,
    })) as ResendResponse
    if (response.error) return { success: false, error: response.error.message || 'Resend send failed.' }
    return { success: true, providerId: response.data?.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
