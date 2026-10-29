import { emailLayout, emailParagraph } from '@/lib/email-layout'

// Inactive-account retention promised in the Privacy Policy: no activity for
// 24 months, a warning email 30 days before deletion. Change here and in
// messages/*.json (Legal.privacy, Legal.terms) together.
export const INACTIVITY_WARN_AFTER_DAYS = 700
export const INACTIVITY_DELETE_AFTER_DAYS = 730
export const INACTIVITY_GRACE_DAYS = 30

export type InactivityStage = 'active' | 'warn' | 'wait' | 'delete'

const DAY_MS = 24 * 60 * 60 * 1000

export function inactivityStage(input: { lastActiveMs: number; nowMs: number; warnedAtMs: number | null }): InactivityStage {
  const idleDays = (input.nowMs - input.lastActiveMs) / DAY_MS
  if (idleDays < INACTIVITY_WARN_AFTER_DAYS) return 'active'
  if (input.warnedAtMs === null) return 'warn'
  const warnedDays = (input.nowMs - input.warnedAtMs) / DAY_MS
  return idleDays >= INACTIVITY_DELETE_AFTER_DAYS && warnedDays >= INACTIVITY_GRACE_DAYS ? 'delete' : 'wait'
}

export function buildInactivityWarningEmail(appUrl: string) {
  return {
    subject: 'Contul tău Joben va fi șters în 30 de zile / Your Joben account will be deleted in 30 days',
    html: emailLayout({
      locale: 'ro',
      heading: 'Contul tău Joben este inactiv',
      unsubscribe: false,
      bodyHtml:
        emailParagraph(`Nu te-ai autentificat de aproape 24 de luni. Conform Politicii de Confidențialitate, ștergem conturile inactive, împreună cu CV-urile și datele asociate, la 30 de zile după acest email. Dacă vrei să îl păstrezi, autentifică-te: <a href="${appUrl}/ro/sign-in">${appUrl}/ro/sign-in</a>.`) +
        `<hr style="border:none;border-top:1px solid #E4E4E0;margin:24px 0;">` +
        `<h2 style="margin:0 0 16px 0;font-size:20px;color:#0A0A0A;">Your Joben account is inactive</h2>` +
        emailParagraph(`You have not signed in for almost 24 months. Under our Privacy Policy we delete inactive accounts, with their CVs and related data, 30 days after this email. To keep it, just sign in: <a href="${appUrl}/en/sign-in">${appUrl}/en/sign-in</a>.`),
    }),
  }
}
