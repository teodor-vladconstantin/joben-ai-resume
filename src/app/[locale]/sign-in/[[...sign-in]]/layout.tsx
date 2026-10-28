import type { Metadata } from 'next'
import { APP_ORIGIN } from '@/lib/app-origin'
import { getTranslations } from 'next-intl/server'

// The page is a client component, so its metadata lives here. Auth form:
// noindex, with its own title instead of inheriting the homepage's.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'SignIn' })
  return {
    title: t('eyebrow'),
    alternates: { canonical: `${APP_ORIGIN}/${locale}/sign-in` },
    robots: { index: false, follow: false },
  }
}

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return children
}
