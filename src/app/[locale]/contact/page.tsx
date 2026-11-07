import type { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { company } from '@/lib/content'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'
import type { Messages } from '@/i18n/messages'
import { PageHero, wrap } from '@/components/marketing/section'
import { cn } from '@/lib/cn'
import { JsonLd } from '@/components/seo/JsonLd'

const PRIVACY_EMAIL = 'privacy@joben.eu'

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })
  const title = t('metaTitle')
  const description = t('metaDescription')
  return {
    title,
    description,
    alternates: localeAlternates(locale, '/contact'),
    openGraph: {
      title,
      description,
      url: `/${locale}/contact`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben AI Resume Builder' }],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const { Common, Contact: c } = (await getMessages({ locale })) as unknown as Messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: c.heading, path: `/${locale}/contact` },
      ]),
    ],
  }
  const link = 'font-medium text-foreground transition-colors hover:text-primary'
  const withEmail = (body: string, email: string) => {
    const [before, after] = body.split('{email}')
    return (
      <>
        {before}
        <a href={`mailto:${email}`} className={link}>{email}</a>
        {after}
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main className="grow">
        <PageHero eyebrow="Joben" title={c.heading} intro={c.intro} />
        <section className="border-t border-border py-16 sm:py-20">
          <div className={cn(wrap, 'grid gap-5 md:grid-cols-3')}>
            {[
              { h: c.generalHeading, body: withEmail(c.generalBody, company.email) },
              { h: c.privacyHeading, body: withEmail(c.privacyBody, PRIVACY_EMAIL) },
              { h: c.companyHeading, body: fill(c.companyBody, company) },
            ].map((card) => (
              <div key={card.h} className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary">
                <h2 className="text-lg font-semibold">{card.h}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
