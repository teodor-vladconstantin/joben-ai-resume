import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Joben <onboarding@resend.dev>'
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

export async function sendWelcomeEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  const firstName = input.firstName?.trim() || 'there'

  try {
    const response = (await client.emails.send({
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
    })) as ResendResponse

    if (response.error) {
      return { success: false, error: response.error.message || 'Resend send failed.' }
    }

    return { success: true, providerId: response.data?.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

export async function sendSevenDayFollowupEmail(input: {
  to: string
  firstName?: string | null
}): Promise<EmailResult> {
  const client = getResendClient()
  if (!client) {
    return { success: false, error: 'RESEND_API_KEY is not configured.' }
  }

  const firstName = input.firstName?.trim() || 'there'

  try {
    const response = (await client.emails.send({
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
    })) as ResendResponse

    if (response.error) {
      return { success: false, error: response.error.message || 'Resend send failed.' }
    }

    return { success: true, providerId: response.data?.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}


