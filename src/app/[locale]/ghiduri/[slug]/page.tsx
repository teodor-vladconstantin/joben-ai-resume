import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { GUIDES, getGuide } from '@/data/guides'
import { GuidePage, guideMetadata } from '@/components/guides/GuidePage'
import type { AppLocale } from '@/i18n/routing'

const GUIDE_LOCALE: AppLocale = 'ro'

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}

// This segment only serves the ro guides; other locales and unknown slugs 404.
// (Returning [] here made Next prerender nothing at all.)
export const dynamicParams = false

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.content[GUIDE_LOCALE].slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const guide = locale === GUIDE_LOCALE ? getGuide(locale, slug) : undefined
  return guide ? guideMetadata(locale, guide) : {}
}

export default async function Page({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const guide = locale === GUIDE_LOCALE ? getGuide(locale, slug) : undefined
  if (!guide) notFound()
  return <GuidePage locale={locale} guide={guide} />
}
