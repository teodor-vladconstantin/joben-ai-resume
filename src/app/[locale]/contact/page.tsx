import type { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { company } from '@/lib/content'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'
import type { Messages } from '@/i18n/messages'
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
  const link = 'text-foreground border-b border-transparent hover:border-primary transition-colors duration-150 ease-out'
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
    <div className="min-h-screen flex flex-col pb-20">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{c.heading}</h1>
        <p className="text-muted-foreground text-lg leading-relaxed mb-10">{c.intro}</p>

        <h2 className="text-xl font-bold text-foreground mb-2">{c.generalHeading}</h2>
        <p className="text-muted-foreground mb-8">{withEmail(c.generalBody, company.email)}</p>

        <h2 className="text-xl font-bold text-foreground mb-2">{c.privacyHeading}</h2>
        <p className="text-muted-foreground mb-8">{withEmail(c.privacyBody, PRIVACY_EMAIL)}</p>

        <h2 className="text-xl font-bold text-foreground mb-2">{c.companyHeading}</h2>
        <p className="text-muted-foreground">{fill(c.companyBody, company)}</p>
      </main>
    </div>
  )
}
