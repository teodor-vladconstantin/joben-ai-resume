import type { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'
import type { Messages } from '@/i18n/messages'
import { PageHero, Section } from '@/components/marketing/section'
import { JsonLd } from '@/components/seo/JsonLd'

const CONTACT_EMAIL = 'privacy@joben.eu'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'About' })

  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: localeAlternates(locale, '/about'),
    openGraph: {
      title,
      description,
      url: `/${locale}/about`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben AI Resume Builder' }],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  }
}

export default async function AboutPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, About: about } = messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: about.heading, path: `/${locale}/about` },
      ]),
    ],
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main className="grow">
        <PageHero eyebrow="Joben" title={about.heading} intro={about.intro} />
        <Section title={about.contactHeading} className="border-t border-border">
          <div className="max-w-2xl rounded-lg border border-border bg-card p-6 text-muted-foreground">
            {about.contactBody.split('{email}')[0]}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-foreground transition-colors hover:text-primary">
              {CONTACT_EMAIL}
            </a>
            {about.contactBody.split('{email}')[1]}
          </div>
        </Section>
      </main>
    </div>
  )
}
