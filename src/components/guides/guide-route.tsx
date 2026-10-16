import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { guidesOfKind, getGuide, type GuideKind } from '@/data/guides'
import { GuidePage, guideMetadata } from '@/components/guides/GuidePage'
import { GuidesHub, hubMetadata } from '@/components/guides/GuidesHub'
import type { AppLocale } from '@/i18n/routing'

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}
interface HubProps {
  params: Promise<{ locale: AppLocale }>
}

// One factory per (kind, locale) segment: /ro/ghiduri, /en/guides, /ro/glosar, ...
// Each route file re-exports these and declares `dynamicParams = false` itself.
export function makeGuideRoute(kind: GuideKind, segmentLocale: AppLocale) {
  return {
    // Returning [] here would make Next prerender nothing at all.
    generateStaticParams: () => guidesOfKind(kind).map((guide) => ({ slug: guide.content[segmentLocale].slug })),
    generateMetadata: async ({ params }: PageProps): Promise<Metadata> => {
      const { locale, slug } = await params
      const guide = locale === segmentLocale ? getGuide(locale, slug, kind) : undefined
      return guide ? guideMetadata(locale, guide) : {}
    },
    Page: async ({ params }: PageProps) => {
      const { locale, slug } = await params
      setRequestLocale(locale)
      const guide = locale === segmentLocale ? getGuide(locale, slug, kind) : undefined
      if (!guide) notFound()
      return <GuidePage locale={locale} guide={guide} />
    },
  }
}

export function makeHubRoute(kind: GuideKind, segmentLocale: AppLocale) {
  return {
    generateMetadata: async ({ params }: HubProps): Promise<Metadata> => {
      const { locale } = await params
      return locale === segmentLocale ? hubMetadata(kind, locale) : {}
    },
    Page: async ({ params }: HubProps) => {
      const { locale } = await params
      if (locale !== segmentLocale) notFound()
      setRequestLocale(locale)
      return <GuidesHub kind={kind} locale={locale} />
    },
  }
}
