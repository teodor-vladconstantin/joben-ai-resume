import type { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

const CONTACT_EMAIL = 'privacy@joben.eu'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'About' })

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/about`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/about`])),
    },
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
    <div className="min-h-screen flex flex-col pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-6">{about.heading}</h1>
        <p className="text-(--muted) text-lg leading-relaxed mb-10">{about.intro}</p>

        <h2 className="text-xl font-bold text-(--foreground) mb-2">{about.contactHeading}</h2>
        <p className="text-(--muted)">
          {about.contactBody.split('{email}')[0]}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-(--accent) hover:text-(--accent-strong)">
            {CONTACT_EMAIL}
          </a>
          {about.contactBody.split('{email}')[1]}
        </p>
      </main>
    </div>
  )
}
