import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

// resumes/page.tsx, resumes/new, and resumes/[id] are all client components,
// so metadata can't live on the page itself — a layout is the only place a
// Server Component can sit in this segment. Authenticated-only pages:
// noindex so a leaked URL doesn't inherit the homepage's title/OG data.
// Localized: a fixed English title showed on the Romanian UI.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Nav' })
  return {
    title: `${t('resumes')} | Joben`,
    robots: { index: false, follow: false },
  }
}

export default function ResumesLayout({ children }: { children: React.ReactNode }) {
  return children
}
