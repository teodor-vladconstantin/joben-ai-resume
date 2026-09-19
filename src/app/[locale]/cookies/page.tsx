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
  const t = await getTranslations({ locale, namespace: 'Legal.cookies' })
  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/cookies`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/cookies`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/cookies`,
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

type CookieRow = {
  name: string
  provider: string
  purpose: string
  duration: string
}

function CookieTable({ headers, rows }: { headers: { name: string; provider: string; purpose: string; duration: string }; rows: CookieRow[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-(--border)">
            <th className="pb-2 pr-4 font-mono text-(length:--text-label) font-normal text-(--muted)">{headers.name}</th>
            <th className="pb-2 pr-4 font-mono text-(length:--text-label) font-normal text-(--muted)">{headers.provider}</th>
            <th className="pb-2 pr-4 font-mono text-(length:--text-label) font-normal text-(--muted)">{headers.purpose}</th>
            <th className="pb-2 font-mono text-(length:--text-label) font-normal text-(--muted)">{headers.duration}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-(--border)">
              <td className="py-2 pr-4 font-mono text-xs text-(--foreground)">{row.name}</td>
              <td className="py-2 pr-4 text-(--muted)">{row.provider}</td>
              <td className="py-2 pr-4 text-(--muted)">{row.purpose}</td>
              <td className="py-2 text-(--muted)">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function CookiesPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Common' })
  const messages = (await getMessages({ locale })) as unknown as Messages
  const cookies = messages.Legal.cookies

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: t('home'), path: `/${locale}` },
        { name: cookies.breadcrumbLabel, path: `/${locale}/cookies` },
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
        <header className="mb-8 pb-8 border-b border-(--border)">
          <h1 className="text-3xl font-bold text-(--foreground)">{cookies.heading}</h1>
          <p className="mt-2 font-mono text-xs text-(--muted)">Last updated: {cookies.lastUpdated}</p>
          <p className="mt-4 text-(--muted)">{cookies.intro}</p>
        </header>

        <article className="divide-y divide-(--border)">
          <section className="py-8 first:pt-0">
            <h2 className="text-lg font-semibold text-(--foreground)">{cookies.necessaryHeading}</h2>
            <p className="mt-2 text-sm leading-6 text-(--muted)">{cookies.necessaryBody}</p>
            <CookieTable headers={cookies.tableHeaders} rows={cookies.necessaryCookies} />
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold text-(--foreground)">{cookies.analyticsHeading}</h2>
            <p className="mt-2 text-sm leading-6 text-(--muted)">{cookies.analyticsBody}</p>
            <CookieTable headers={cookies.tableHeaders} rows={cookies.analyticsCookies} />
          </section>

          <section className="py-8">
            <h2 className="text-lg font-semibold text-(--foreground)">{cookies.marketingHeading}</h2>
            <p className="mt-2 text-sm leading-6 text-(--muted)">{cookies.marketingBody}</p>
          </section>
        </article>

        <p className="mt-8 text-sm text-(--muted)">
          {cookies.footerPrefix}
          <Link href="/privacy" className="text-(--foreground) border-b border-transparent hover:border-(--accent) transition-colors duration-150 ease-out">{cookies.footerLinkLabel}</Link>
          {cookies.footerSuffix}
        </p>
      </main>
    </div>
  )
}
