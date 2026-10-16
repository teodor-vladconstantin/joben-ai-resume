import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SEO_JOBS, findSeoJob } from '@/data/seo-jobs'
import { CoverLetterPage, coverLetterMetadata } from '@/components/seo/CoverLetterPage'
import type { AppLocale } from '@/i18n/routing'

const SEGMENT_LOCALE: AppLocale = 'ro'

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}

// This segment only serves the ro cover letters; other locales and unknown slugs 404.
export const dynamicParams = false

export function generateStaticParams() {
  return SEO_JOBS.map((job) => ({ slug: job.slug[SEGMENT_LOCALE] }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  return locale === SEGMENT_LOCALE && findSeoJob(locale, slug) ? coverLetterMetadata(locale, slug) : {}
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  if (locale !== SEGMENT_LOCALE || !findSeoJob(locale, slug)) notFound()
  return <CoverLetterPage locale={locale} slug={slug} />
}
