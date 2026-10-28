import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { ArrowRight, Briefcase, Sparkles } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { AppLink } from '@/components/ui/AppLink'
import { Navbar } from '@/components/ui/Navbar'
import { PageHero, CtaCard, wrap } from '@/components/marketing/section'
import { cn } from '@/lib/cn'
import { buttonVariants } from '@/components/ui/Button'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { siteConfig } from '@/lib/content'
import { routing, type AppLocale } from '@/i18n/routing'
import { coverLetterPath, findSeoJob } from '@/data/seo-jobs'
import { JsonLd } from '@/components/seo/JsonLd'

// Content dates for the Article JSON-LD; bump DATE_MODIFIED when the samples change.
const DATE_PUBLISHED = '2026-10-14'
const DATE_MODIFIED = '2026-10-16'

export async function coverLetterMetadata(locale: AppLocale, slug: string): Promise<Metadata> {
  const job = findSeoJob(locale, slug)
  if (!job) return {}

  const t = await getTranslations({ locale, namespace: 'SeoCoverLetter' })
  const title = t('metaTitle', { role: job.title[locale] })
  const description = t('metaDescription', { role: job.title[locale] })
  const path = `/${locale}${coverLetterPath(locale, job)}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, `/${l}${coverLetterPath(l, job)}`])),
        'x-default': `/${routing.defaultLocale}${coverLetterPath(routing.defaultLocale, job)}`,
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

export async function CoverLetterPage({ locale, slug }: { locale: AppLocale; slug: string }) {
  setRequestLocale(locale)
  const job = findSeoJob(locale, slug)
  if (!job) notFound()

  const t = await getTranslations({ locale, namespace: 'SeoCoverLetter' })
  const tCommon = await getTranslations({ locale, namespace: 'Common' })
  const role = job.title[locale]
  const roleLower = role.toLowerCase()
  const sample = job.coverLetterSample[locale]
  const path = `/${locale}${coverLetterPath(locale, job)}`

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
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main>
        <PageHero
          eyebrow={t('eyebrow')}
          title={t('heading', { role })}
          intro={
            <>
              {t('subheading')}
              <span className="mt-4 flex">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-foreground">
                  <Briefcase className="h-3.5 w-3.5" />
                  {t('fieldLabel', { category: job.category[locale] })}
                </span>
              </span>
            </>
          }
        />
        <div className={cn(wrap, 'space-y-8 py-12 sm:py-16')}>
        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h2 className="text-2xl font-bold text-foreground">{t('sampleHeading', { role })}</h2>
              <p className="text-xs text-muted-foreground mt-1">{t('sampleHint')}</p>
            </div>
            <AppLink
              href="/sign-up"
              className={`shrink-0 ${buttonVariants('primary', 'sm')} text-xs font-semibold flex items-center gap-1.5`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{t('generateCta')}</span>
            </AppLink>
          </div>

          <div className="space-y-4 rounded-lg border border-border bg-background p-6 text-sm leading-relaxed text-foreground/90">
            <p>{sample.intro}</p>
            <p>{sample.body}</p>
            <p>{sample.closing}</p>
            <div className="pt-2 text-xs text-muted-foreground">{t('signature')}</div>
          </div>
        </div>

        <div className="space-y-6 rounded-xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h2 className="text-2xl font-bold text-foreground">{t('rulesHeading', { roleLower })}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {rules.map((rule, i) => (
              <div key={rule.title} className="space-y-2">
                <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center">
                  {i + 1}
                </span>
                <h3 className="font-bold text-sm text-foreground">{rule.title}</h3>
                <p className="text-xs text-muted-foreground">{rule.body}</p>
              </div>
            ))}
          </div>
        </div>

        </div>
        <CtaCard title={t('resumeCtaHeading', { role })} text={t('resumeCtaBody')}>
          <Link href={`/resume-examples/${job.resumeRoleSlug[locale]}`} className={buttonVariants('primary', 'md')}>
            <span>{t('resumeCtaButton')}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </CtaCard>
      </main>
    </div>
  )
}
