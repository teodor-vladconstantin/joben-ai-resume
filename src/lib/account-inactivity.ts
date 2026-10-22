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
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0A0A0A;max-width:560px;margin:0 auto;">
  <h1 style="font-size:20px;">Contul tău Joben este inactiv</h1>
  <p>Nu te-ai autentificat de aproape 24 de luni. Conform Politicii de Confidențialitate, ștergem conturile inactive, împreună cu CV-urile și datele asociate, la 30 de zile după acest email. Dacă vrei să îl păstrezi, autentifică-te: <a href="${appUrl}/ro/sign-in">${appUrl}/ro/sign-in</a>.</p>
  <hr style="border:none;border-top:1px solid #ddd;margin:20px 0;">
  <h1 style="font-size:20px;">Your Joben account is inactive</h1>
  <p>You have not signed in for almost 24 months. Under our Privacy Policy we delete inactive accounts, with their CVs and related data, 30 days after this email. To keep it, just sign in: <a href="${appUrl}/en/sign-in">${appUrl}/en/sign-in</a>.</p>
  <p style="color:#5C5C57;font-size:13px;">TETA ABC SRL, hello@joben.eu</p>
</div>`,
  }
}
