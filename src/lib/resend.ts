import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Joben <onboarding@resend.dev>'
const automationFromEmail = 'Joben <no-reply@joben.eu>'
const feedbackFromEmail = 'Duku from Joben <duku@joben.eu>'
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

export async function sendFeedbackRequestEmail(input: {
  to: string
  firstName?: string | null
  trigger: 'resume_created' | 'document_downloaded'
}): Promise<EmailResult> {
  const firstName = input.firstName?.trim() || 'acolo'

  const introLine =
    input.trigger === 'resume_created'
      ? 'Văd că tocmai ai creat un CV pe Joben.'
      : 'Văd că tocmai ai descărcat un CV sau o scrisoare de intenție de pe Joben.'

  return sendEmail({
    from: feedbackFromEmail,
    to: input.to,
    subject: 'Cum a fost experiența cu Joben?',
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0D2818;max-width:560px;margin:0 auto;">
  <h1 style="font-size:22px;margin-bottom:8px;">Salut, ${firstName}.</h1>
  <p style="margin:0 0 12px 0;">${introLine}</p>
  <p style="margin:0 0 18px 0;">Sunt Duku, fac Joben. Mi-ar plăcea să aflu părerea ta directă — răspunde la acest email cu orice gând ai, bun sau rău.</p>
  <p style="margin-top:18px;color:#6b7280;font-size:13px;">Preferi un formular scurt? <a href="https://joben.eu/feedback" style="color:#0A9548;">Lasă feedback aici</a>.</p>
</div>`,
  })
}
