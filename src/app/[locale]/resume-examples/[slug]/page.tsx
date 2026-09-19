import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { notFound } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge, Eyebrow } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { getResumeRole, resumeRoles } from '@/data/resume-roles'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

// English-only: "a {role} resume" needs "an" before a vowel sound
// (Entry-Level, Internship). Romanian doesn't need an inserted article for
// the equivalent phrasing, so this only applies when locale === 'en'.
function articleFor(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

function fill(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [key, value]) => acc.replaceAll(`{${key}}`, value), template)
}

// Only the roles in resume-roles.ts are valid; an unlisted slug should 404,
// not attempt an on-demand render with no matching content.
export const dynamicParams = false

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as AppLocale
  return resumeRoles.map((role) => ({ slug: role.slug[locale] }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const role = getResumeRole(locale, slug)
  if (!role) return {}

  const messages = (await getMessages({ locale })) as unknown as Messages
  const m = messages.Metadata.resumeExampleRole
  const title = fill(m.title, { role: role.title[locale] })
  const description = fill(m.description, { role: role.title[locale] })

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/resume-examples/${role.slug[locale]}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/resume-examples/${role.slug[l]}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/resume-examples/${role.slug[locale]}`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${role.title[locale]} Resume Examples, Joben` }],
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

export default async function ResumeRolePage({
  params,
}: {
  params: Promise<{ locale: AppLocale; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const role = getResumeRole(locale, slug)
  if (!role) notFound()

  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, ResumeExampleRole: r } = messages

  const title = role.title[locale]
  const roleLower = title.toLowerCase()
  const article = locale === 'en' ? articleFor(roleLower) : ''

  // AEO: re-expresses the keywords/mistakes content already visible below in
  // Q&A form, plus a breadcrumb — no facts beyond what's already on the page.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: r.breadcrumbHub, path: `/${locale}/resume-examples` },
        { name: fill(messages.ResumeExamplesHub.itemListName, { role: title }), path: `/${locale}/resume-examples/${role.slug[locale]}` },
      ]),
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: fill(r.faqKeywordsQuestion, { roleLower, roleLowerWithArticle: article ? `${article} ${roleLower}` : roleLower }),
            acceptedAnswer: {
              '@type': 'Answer',
              text: role.keywords[locale].join(', '),
            },
          },
          {
            '@type': 'Question',
            name: fill(r.faqMistakesQuestion, { roleLower }),
            acceptedAnswer: {
              '@type': 'Answer',
              text: role.commonMistakes[locale].join(' '),
            },
          },
        ],
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
          <Eyebrow>{messages.ResumeExamplesHub.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {fill(r.heading, { role: title })}
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            {fill(r.subheading, { roleLower })}
          </p>
        </div>

        <div className="space-y-8">
          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-1">
              {r.keywordsHeading}
            </h2>
            <p className="text-(--muted) text-sm mb-5">
              {r.keywordsHint}
            </p>
            <div className="flex flex-wrap gap-2">
              {role.keywords[locale].map((keyword) => (
                <Badge key={keyword} variant="muted">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>

          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-5">
              {fill(r.mistakesHeading, { role: title })}
            </h2>
            <ul className="space-y-4">
              {role.commonMistakes[locale].map((mistake, index) => (
                <li key={index} className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-(--foreground) mt-0.5" />
                  <p className="text-(--muted) text-sm">{mistake}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-5">
              {r.bulletExampleHeading}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="border border-(--border) bg-(--surface) p-4">
                <p className="flex items-center gap-2 font-mono text-(length:--text-label) text-(--muted) mb-2">
                  <XCircle className="h-4 w-4" /> {r.weak}
                </p>
                <p className="text-sm text-(--foreground)">{role.weakBullet[locale]}</p>
              </div>
              <div className="border border-(--border) bg-(--accent-muted) p-4">
                <p className="flex items-center gap-2 font-mono text-(length:--text-label) text-(--foreground) mb-2">
                  <CheckCircle2 className="h-4 w-4" /> {r.strong}
                </p>
                <p className="text-sm text-(--foreground)">{role.strongBullet[locale]}</p>
              </div>
            </div>
          </Card>

          <Card elevated radius="lg" className="p-6 sm:p-8 text-center">
            <p className="text-(--foreground) font-semibold text-lg">
              {fill(r.scoreCtaHeading, { role: title })}
            </p>
            <p className="text-(--muted) text-sm mt-1.5 max-w-md mx-auto">
              {r.scoreCtaSubheading}
            </p>
            <Link href="/free-ats-checker" className={`mt-5 inline-flex ${buttonVariants('primary', 'md')}`}>
              {fill(r.scoreCtaButton, { role: title })}
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
