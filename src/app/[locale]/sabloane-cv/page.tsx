import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CvTemplatesPage, cvTemplatesMetadata } from '@/components/seo/CvTemplatesPage'
import type { AppLocale } from '@/i18n/routing'

const SEGMENT_LOCALE: AppLocale = 'ro'

interface PageProps {
  params: Promise<{ locale: AppLocale }>
}

// This segment only serves the ro page; the other locale 404s.
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  return locale === SEGMENT_LOCALE ? cvTemplatesMetadata(locale) : {}
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params
  if (locale !== SEGMENT_LOCALE) notFound()
  return <CvTemplatesPage locale={locale} />
}
