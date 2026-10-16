import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { siteConfig } from '@/lib/content'
import { routing, type AppLocale } from '@/i18n/routing'
import { SEO_JOBS, type SeoJob } from '@/data/seo-jobs'
import { JsonLd } from '@/components/seo/JsonLd'

// Content dates for the Article JSON-LD; bump DATE_MODIFIED when the samples change.
const DATE_PUBLISHED = '2026-10-14'
const DATE_MODIFIED = '2026-10-14'

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}

// Each locale only serves its own slug; the other locale's slug 404s.
export const dynamicParams = false

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as AppLocale
  return SEO_JOBS.map((job) => ({ slug: job.slug[locale] }))
}

function findJob(locale: AppLocale, slug: string): SeoJob | undefined {
  return SEO_JOBS.find((job) => job.slug[locale] === slug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const job = findJob(locale, slug)
  if (!job) return {}

  const t = await getTranslations({ locale, namespace: 'SeoCoverLetter' })
  const title = t('metaTitle', { role: job.title[locale] })
  const description = t('metaDescription', { role: job.title[locale] })
  const path = `/${locale}/scrisoare-intentie/${job.slug[locale]}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}/scrisoare-intentie/${job.slug[l]}`])),
        'x-default': `/ro/scrisoare-intentie/${job.slug.ro}`,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'article',
    },
  }
}

export default async function SeoScrisoareIntentiePage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const job = findJob(locale, slug)
  if (!job) notFound()

  const t = await getTranslations({ locale, namespace: 'SeoCoverLetter' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })
  const role = job.title[locale]
  const roleLower = role.toLowerCase()
  const sample = job.coverLetterSample[locale]
  const path = `/${locale}/scrisoare-intentie/${job.slug[locale]}`

  const rules = [
    { title: t('rule1Title'), body: t('rule1Body', { bullet: job.bulletExamples[0].strong[locale] }) },
    { title: t('rule2Title'), body: t('rule2Body', { tools: job.keywords.tools.slice(0, 3).join(', ') }) },
    { title: t('rule3Title'), body: t('rule3Body', { certification: job.keywords.certifications[locale][0] }) },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: tCommon('home'), path: `/${locale}` },
        { name: t('heading', { role }), path },
      ]),
      {
        '@type': 'Article',
        headline: t('heading', { role }),
        description: t('metaDescription', { role }),
        inLanguage: locale,
        datePublished: DATE_PUBLISHED,
        dateModified: DATE_MODIFIED,
        mainEntityOfPage: `${siteConfig.url}${path}`,
        author: { '@type': 'Organization', name: 'Joben', url: siteConfig.url },
        publisher: { '@type': 'Organization', name: 'Joben', url: siteConfig.url },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24 space-y-12">
        <div className="text-center space-y-4">
          <Eyebrow>{t('eyebrow')}</Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-(--foreground)">
            {t('heading', { role })}
          </h1>
          <p className="text-(--muted) text-lg max-w-2xl mx-auto">{t('subheading')}</p>
          <div className="flex items-center justify-center pt-2">
            <span className="px-3 py-1 rounded-full bg-(--accent-muted) text-xs font-mono font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {t('fieldLabel', { category: job.category[locale] })}
            </span>
          </div>
        </div>

        <Card radius="lg" className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-(--border)">
            <div>
              <h2 className="text-2xl font-bold text-(--foreground)">{t('sampleHeading', { role })}</h2>
              <p className="text-xs text-(--muted) mt-1">{t('sampleHint')}</p>
            </div>
            <Link
              href="/sign-up"
              className={`shrink-0 ${buttonVariants('primary', 'sm')} text-xs font-semibold flex items-center gap-1.5`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('generateCta')}</span>
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-(--surface) border border-(--border) space-y-4 font-sans text-sm text-(--foreground)/90 leading-relaxed">
            <p>{sample.intro}</p>
            <p>{sample.body}</p>
            <p>{sample.closing}</p>
            <div className="pt-2 text-xs text-(--muted) font-mono">{t('signature')}</div>
          </div>
        </Card>

        <Card radius="lg" className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-(--foreground)">{t('rulesHeading', { roleLower })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {rules.map((rule, i) => (
              <div key={rule.title} className="space-y-2">
                <span className="h-7 w-7 rounded-full bg-(--foreground) text-(--background) font-bold text-xs flex items-center justify-center font-mono">
                  {i + 1}
                </span>
                <h3 className="font-bold text-sm text-(--foreground)">{rule.title}</h3>
                <p className="text-xs text-(--muted)">{rule.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-(--foreground)">{t('resumeCtaHeading', { role })}</h3>
            <p className="text-xs text-(--muted) mt-1">{t('resumeCtaBody')}</p>
          </div>
          <Link
            href={`/resume-examples/${job.resumeRoleSlug[locale]}`}
            className={`shrink-0 ${buttonVariants('secondary', 'md')} text-sm font-semibold flex items-center gap-1.5`}
          >
            <span>{t('resumeCtaButton')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
