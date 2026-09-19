import type { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { FreeAtsCheckerClient } from './FreeAtsCheckerClient'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { BUILD_TIME } from '@/lib/content'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.atsChecker' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/free-ats-checker`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/free-ats-checker`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/free-ats-checker`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben Free ATS Resume Checker' }],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  }
}

export default async function FreeAtsCheckerPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, AtsChecker: atsChecker } = messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: atsChecker.heading, path: `/${locale}/free-ats-checker` },
      ]),
      {
        '@type': 'WebApplication',
        name: 'Joben Free ATS Resume Checker',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        description: atsChecker.subheading,
        dateModified: BUILD_TIME,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RON',
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <Eyebrow>{atsChecker.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {atsChecker.heading}
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            {atsChecker.subheading}
          </p>
        </div>

        <FreeAtsCheckerClient />
      </main>
    </div>
  )
}
