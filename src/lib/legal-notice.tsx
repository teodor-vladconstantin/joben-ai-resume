import { createServerClient } from '@/lib/supabase/server'
import { LEGAL_CHANGELOG, LEGAL_VERSION, type LegalChange } from '@/lib/legal/versions'
import { SimpleBody } from '@/emails/bodies'
import { APP_ORIGIN } from '@/lib/app-origin'
import type { AppLocale } from '@/i18n/routing'

const origin = APP_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || 'https://joben.eu'

// Emails sent per request, so one call stays well inside the function time limit.
// The workflow calls the route again until `remaining` is 0.
export const LEGAL_NOTICE_BATCH = 20

const COPY: Record<AppLocale, { subject: string; heading: string; intro: string; outro: string; cta: string; note: string }> = {
  ro: {
    subject: 'Am actualizat Termenii și Politica de Confidențialitate Joben',
    heading: 'Am actualizat documentele legale Joben',
    intro: 'Ce s-a schimbat:',
    outro: 'La următoarea autentificare îți cerem să confirmi versiunile noi. Poți exporta sau șterge oricând datele din Setări.',
    cta: 'Citește Termenii',
    note: 'Primești acest email pentru că ai un cont Joben. Este un anunț despre contractul tău cu noi.',
  },
  en: {
    subject: 'We updated the Joben Terms and Privacy Policy',
    heading: 'We updated the Joben legal documents',
    intro: 'What changed:',
    outro: 'The next time you sign in we will ask you to confirm the new versions. You can export or delete your data in Settings at any time.',
    cta: 'Read the Terms',
    note: 'You receive this email because you have a Joben account. It is a notice about your contract with us.',
  },
}

export function buildLegalNoticeEmail(locale: AppLocale, change: LegalChange) {
  const copy = COPY[locale] ?? COPY.ro
  return {
    subject: copy.subject,
    body: (
      <SimpleBody
        heading={copy.heading}
        paragraphs={[copy.intro]}
        bullets={change[locale] ?? change.ro}
        ctaHref={`${origin}/${locale}/terms`}
        ctaLabel={copy.cta}
        note={`${copy.outro} ${copy.note}`}
      />
    ),
  }
}

export type LegalNoticeRecipient = { clerk_id: string; email: string }

// Users who have not accepted the current version (new sign-ups already did)
// and have not been emailed about it yet.
export async function findLegalNoticeRecipients(version: string = LEGAL_VERSION): Promise<LegalNoticeRecipient[]> {
  const supabase = createServerClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('clerk_id, email, tos_version')
    .not('email', 'is', null)
  if (error) throw new Error(`users lookup failed: ${error.message}`)

  const { data: delivered, error: deliveredError } = await supabase
    .from('legal_notice_deliveries')
    .select('user_clerk_id')
    .eq('version', version)
  if (deliveredError) throw new Error(`deliveries lookup failed: ${deliveredError.message}`)

  const done = new Set((delivered ?? []).map((row) => row.user_clerk_id as string))
  return (users ?? [])
    .filter((u) => u.email && u.tos_version !== version && !done.has(u.clerk_id as string))
    .map((u) => ({ clerk_id: u.clerk_id as string, email: u.email as string }))
}

export function currentLegalChange(): LegalChange {
  return LEGAL_CHANGELOG[0]
}
