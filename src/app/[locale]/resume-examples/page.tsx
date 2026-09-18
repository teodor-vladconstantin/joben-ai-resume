import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { ArrowRight } from 'lucide-react'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'
import { resumeRoles } from '@/data/resume-roles'
import { siteConfig } from '@/lib/content'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.resumeExamplesHub' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/resume-examples`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/resume-examples`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/resume-examples`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Resume Examples by Role, Joben' }],
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

export default async function ResumeExamplesIndexPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, ResumeExamplesHub: hub } = messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: hub.heading, path: `/${locale}/resume-examples` },
      ]),
      {
        '@type': 'ItemList',
        itemListElement: resumeRoles.map((role, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: hub.itemListName.replace('{role}', role.title[locale]),
          url: `${siteConfig.url}/${locale}/resume-examples/${role.slug[locale]}`,
        })),
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

      <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <Eyebrow>{hub.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {hub.heading}
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            {hub.subheading}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumeRoles.map((role) => (
            <Link key={role.slug[locale]} href={`/resume-examples/${role.slug[locale]}`}>
              <Card radius="lg" className="p-6 h-full transition-colors hover:border-(--accent)/50">
                <p className="text-(--foreground) font-semibold">{role.title[locale]}</p>
                <p className="mt-1.5 text-sm text-(--muted)">
                  {role.keywords[locale].slice(0, 3).join(', ')}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-(--accent)">
                  {hub.seeExamples} <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
