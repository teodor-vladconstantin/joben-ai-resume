import { Resend } from 'resend'

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
}

type ResendResponse = {
  data?: {
    id?: string
  } | null
  error?: {
    message?: string
  } | null
}

async function sendEmail(input: {
  from: string
  to: string
  subject: string
  html: string
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  try {
    const response = (await client.emails.send({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Welcome to Joben, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">Your account is ready. Start building ATS-optimized resumes and cover letters in minutes.</p>
  <p style="margin:0 0 18px 0;">You can also run an AI review to identify quick wins before your next application.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Open Dashboard</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">You are receiving this because you created a Joben account.</p>
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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">One-week check-in, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">If you have not done it yet, run one AI review and tailor one resume to a target role.</p>
  <p style="margin:0 0 18px 0;">These two steps usually produce the biggest quality jump in less than 10 minutes.</p>
  <a href="${appUrl}/ai-review" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Run AI Review</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">Need help? Reply to this email and we will point you to the fastest workflow.</p>
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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Nice work, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">Your first resume is now in Joben. Keep refining it or export a clean PDF anytime.</p>
  <p style="margin:0 0 18px 0;">Ready to share it? Head to your dashboard and export the PDF in one click.</p>
  <a href="${appUrl}/dashboard" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Open Dashboard</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">You are receiving this because you created a resume on Joben.</p>
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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Quick reminder, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">You created a Joben account recently, and your resume is still waiting for you.</p>
  <p style="margin:0 0 18px 0;">Jump back in to generate your resume in minutes and export a PDF when ready.</p>
  <a href="${appUrl}/resumes/new" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Generate Resume</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">If you already finished, you can ignore this email.</p>
</div>`,
  })
}

export type AtsCategoryKey = 'ats_formatting' | 'structure' | 'keyword_impact' | 'clarity'

const CATEGORY_LABELS: Record<AtsCategoryKey, string> = {
  ats_formatting: 'ATS Formatting',
  structure: 'Structure',
  keyword_impact: 'Keywords & Impact',
  clarity: 'Clarity',
}

export async function sendAnonymousScanReportEmail(input: {
  to: string
  overallScore: number
  grade: string
  categories: Record<AtsCategoryKey, { score: number; max: number }>
  issues: { issue: string; explanation: string }[]
}): Promise<EmailResult> {
  const categoryRows = (Object.keys(CATEGORY_LABELS) as AtsCategoryKey[])
    .map((key) => `<li style="margin:0 0 4px 0;">${CATEGORY_LABELS[key]}: ${input.categories[key].score}/${input.categories[key].max}</li>`)
    .join('')

  const issueRows = input.issues
    .slice(0, 3)
    .map((item) => `<li style="margin:0 0 10px 0;"><strong>${item.issue}</strong><br/><span style="color:#6b7280;font-size:13px;">${item.explanation}</span></li>`)
    .join('')

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: `Your resume scored ${input.overallScore}/100: here's what to fix`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Your resume scored ${input.overallScore}/100 (${input.grade}).</h1>
  <p style="margin:0 0 12px 0;">Here is the category breakdown from your free ATS scan:</p>
  <ul style="margin:0 0 18px 18px;padding:0;">${categoryRows}</ul>
  ${issueRows ? `<p style="margin:0 0 8px 0;">Top things to fix:</p><ul style="margin:0 0 18px 18px;padding:0;">${issueRows}</ul>` : ''}
  <a href="${appUrl}/sign-up" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Fix It Free with Joben</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">You are receiving this because you requested your ATS score report on joben.eu.</p>
</div>`,
  })
}

const CATEGORY_48H_COPY: Record<AtsCategoryKey, { subject: string; body: string }> = {
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
}

export async function sendAnonymousScan48hEmail(input: {
  to: string
  weakestCategory: AtsCategoryKey | null
}): Promise<EmailResult> {
  const copy = input.weakestCategory ? CATEGORY_48H_COPY[input.weakestCategory] : null

  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: copy?.subject || 'Still want to fix what your resume scan found?',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">A couple of days ago you scanned your resume on Joben.</h1>
  <p style="margin:0 0 12px 0;">${copy?.body || 'Your ATS scan found a few things worth fixing before your next application.'}</p>
  <p style="margin:0 0 18px 0;">A free Joben account gives you AI-guided rewrites and an ATS-optimized template to fix it in minutes.</p>
  <a href="${appUrl}/sign-up" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Fix My Resume Free</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">You are receiving this because you requested your ATS score report on joben.eu.</p>
</div>`,
  })
}

export async function sendAnonymousScan7dEmail(input: { to: string }): Promise<EmailResult> {
  return sendEmail({
    from: automationFromEmail,
    to: input.to,
    subject: 'Still on the job hunt?',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">No pressure, just leaving this here.</h1>
  <p style="margin:0 0 12px 0;">A week ago you ran a free ATS scan on Joben. If you are still applying, a free account gives you AI resume tailoring, bullet rewrites, and cover letters whenever you need them.</p>
  <a href="${appUrl}/sign-up" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Create a Free Account</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">You are receiving this because you requested your ATS score report on joben.eu. This is the last reminder in this series.</p>
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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Heads up, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">You just reached a free plan limit on Joben.</p>
  <p style="margin:0 0 18px 0;">Upgrade to Pro to unlock:</p>
  <ul style="margin:0 0 18px 18px;padding:0;">
    <li>Unlimited resumes and PDF exports</li>
    <li>Much higher AI limits for reviews and rewrites</li>
    <li>Priority support when you need help</li>
  </ul>
  <a href="${appUrl}/pricing" style="display:inline-block;background:#0A9548;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Upgrade to Pro</a>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">Thanks for building with Joben.</p>
</div>`,
  })
}
