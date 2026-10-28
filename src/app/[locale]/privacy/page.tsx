import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { CompanyDetails } from '@/components/layout/CompanyDetails'
import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'
import type { Messages } from '@/i18n/messages'
import { JsonLd } from '@/components/seo/JsonLd'
import { LegalText } from '@/components/legal/LegalText'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Legal.privacy' })
  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: localeAlternates(locale, '/privacy'),
    openGraph: {
      title,
      description,
      url: `/${locale}/privacy`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben AI Resume Builder' }],
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

export default async function PrivacyPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Common' })
  const messages = (await getMessages({ locale })) as unknown as Messages
  const privacy = messages.Legal.privacy

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: t('home'), path: `/${locale}` },
        { name: privacy.breadcrumbLabel, path: `/${locale}/privacy` },
      ]),
    ],
  }

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <header className="mb-8 pb-8 border-b border-border">
          <h1 className="text-3xl font-bold text-foreground">{privacy.heading}</h1>
          <p className="mt-2 text-xs text-muted-foreground">{t('lastUpdated')}: {privacy.lastUpdated}</p>
          <p className="mt-4 text-muted-foreground">{privacy.intro}</p>
          <CompanyDetails className="mt-4 text-sm text-muted-foreground" />
        </header>

        <article className="divide-y divide-border">
          {privacy.sections?.map((section) => (
            <section key={section.title} className="py-8 first:pt-0">
              <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
              <LegalText text={section.content} />
            </section>
          ))}
        </article>

        <p className="mt-8 text-sm text-muted-foreground">
          {privacy.footerPrefix}
          <Link href="/terms" className="text-foreground border-b border-transparent hover:border-primary transition-colors duration-150 ease-out">{privacy.footerLinkLabel}</Link>
          {privacy.footerSuffix}
        </p>
      </main>
    </div>
  )
}
