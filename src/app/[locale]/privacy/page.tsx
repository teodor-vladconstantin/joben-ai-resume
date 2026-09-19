import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

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
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/privacy`])),
    },
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <header className="mb-8 rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
          <h1 className="text-3xl font-bold text-white">{privacy.heading}</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">Last updated: {privacy.lastUpdated}</p>
          <p className="mt-4 text-[#FFFFFF]/82">{privacy.intro}</p>
        </header>

        <article className="space-y-4">
          {privacy.sections?.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">{section.content}</p>
            </section>
          ))}
        </article>

        <p className="mt-8 text-sm text-[#FFFFFF]/60">
          {privacy.footerPrefix}
          <Link href="/terms" className="text-[#16DB65] hover:text-[#0A9548]">{privacy.footerLinkLabel}</Link>
          {privacy.footerSuffix}
        </p>
      </main>
    </div>
  )
}
