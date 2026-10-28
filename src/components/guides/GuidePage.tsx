import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { TrackedLink } from '@/components/ui/TrackedLink'
import { Navbar } from '@/components/ui/Navbar'
import { PageHero } from '@/components/marketing/section'
import { buttonVariants } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { atsCheckerPath } from '@/lib/ats-checker-path'
import { siteConfig } from '@/lib/content'
import { GUIDE_SEGMENT, guidePath, guidesOfKind, kindOf, type Guide, type GuideKind } from '@/data/guides'
import { routing, type AppLocale } from '@/i18n/routing'

// Copy around the guide text. Guides carry their own per-locale content, so
// this small chrome lives here instead of in messages/*.json.
const COPY: Record<
  AppLocale,
  {
    eyebrow: string
    answerLabel: string
    updated: string
    faqHeading: string
    home: string
    ctaHeading: string
    ctaBody: string
    ctaButton: string
    ogLocale: string
  }
> = {
  ro: {
    eyebrow: 'Ghid',
    answerLabel: 'Pe scurt',
    updated: 'Actualizat',
    faqHeading: 'Întrebări frecvente',
    home: 'Acasă',
    ctaHeading: 'Vezi cum își citește un ATS CV-ul tău',
    ctaBody: 'Încarcă CV-ul și primești gratuit un scor de la 0 la 100 și punctele de reparat. Fără cont.',
    ctaButton: 'Scanează CV-ul gratuit',
    ogLocale: 'ro_RO',
  },
  en: {
    eyebrow: 'Guide',
    answerLabel: 'In short',
    updated: 'Updated',
    faqHeading: 'Frequently asked questions',
    home: 'Home',
    ctaHeading: 'See how an ATS reads your resume',
    ctaBody: 'Upload your resume and get a free score from 0 to 100 and the points to fix. No account needed.',
    ctaButton: 'Scan your resume free',
    ogLocale: 'en_US',
  },
}

const KIND_COPY: Record<GuideKind, Record<AppLocale, { eyebrow: string; related: string; hub: string }>> = {
  guide: {
    ro: { eyebrow: 'Ghid', related: 'Alte ghiduri', hub: 'Toate ghidurile' },
    en: { eyebrow: 'Guide', related: 'More guides', hub: 'All guides' },
  },
  glossary: {
    ro: { eyebrow: 'Glosar', related: 'Alți termeni', hub: 'Tot glosarul' },
    en: { eyebrow: 'Glossary', related: 'More terms', hub: 'Full glossary' },
  },
  compare: {
    ro: { eyebrow: 'Comparație', related: 'Alte comparații', hub: 'Toate comparațiile' },
    en: { eyebrow: 'Comparison', related: 'More comparisons', hub: 'All comparisons' },
  },
}

const fullPath = (locale: AppLocale, guide: Guide) => `/${locale}${guidePath(locale, guide)}`

export function guideMetadata(locale: AppLocale, guide: Guide): Metadata {
  const content = guide.content[locale]
  const path = fullPath(locale, guide)
  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: path,
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, fullPath(l, guide)])),
        'x-default': fullPath(routing.defaultLocale, guide),
      },
    },
    openGraph: {
      title: content.title,
      description: content.description,
      url: path,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: content.title }],
      locale: COPY[locale].ogLocale,
      type: 'article',
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
    twitter: {
      card: 'summary_large_image',
      title: content.title,
      description: content.description,
      images: ['/og-image.png'],
    },
  }
}

export function GuidePage({ locale, guide }: { locale: AppLocale; guide: Guide }) {
  const copy = COPY[locale]
  const kind = kindOf(guide)
  const kindCopy = KIND_COPY[kind][locale]
  const related = guidesOfKind(kind)
    .filter((g) => g !== guide)
    .slice(0, 4)
  const content = guide.content[locale]
  const path = fullPath(locale, guide)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: copy.home, path: `/${locale}` },
        { name: content.title, path },
      ]),
      {
        '@type': 'Article',
        headline: content.title,
        description: content.description,
        inLanguage: locale,
        datePublished: guide.datePublished,
        dateModified: guide.dateModified,
        mainEntityOfPage: `${siteConfig.url}${path}`,
        author: { '@id': `${siteConfig.url}/#organization` },
        publisher: { '@id': `${siteConfig.url}/#organization` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: content.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main>
        <PageHero
          eyebrow={kindCopy.eyebrow}
          title={content.title}
          intro={
            <span className="text-sm">
              {copy.updated}: <time dateTime={guide.dateModified}>{guide.dateModified}</time>
            </span>
          }
        />
        <div className="mx-auto w-full max-w-3xl space-y-12 px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-lg border border-border border-l-4 border-l-primary bg-card p-6 sm:p-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand">{copy.answerLabel}</p>
          <p className="text-lg leading-relaxed">{content.answer}</p>
        </div>

        {content.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-muted-foreground leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">{copy.faqHeading}</h2>
          {content.faq.map((item) => (
            <div key={item.question} className="rounded-lg border border-border bg-card p-5 space-y-2">
              <h3 className="font-semibold text-foreground">{item.question}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </section>

        <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-border bg-card p-6 shadow-card sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">{copy.ctaHeading}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{copy.ctaBody}</p>
          </div>
          <TrackedLink
            href={atsCheckerPath(locale)}
            ctaId={`${kind}_ats_cta`}
            className={`shrink-0 ${buttonVariants('primary', 'md')}`}
          >
            <span>{copy.ctaButton}</span>
            <ArrowRight className="h-4 w-4" />
          </TrackedLink>
        </div>
        {related.length > 0 && (
          <nav aria-label={kindCopy.related} className="space-y-3">
            <h2 className="text-lg font-bold text-foreground">{kindCopy.related}</h2>
            <ul className="space-y-2">
              {related.map((g) => (
                <li key={g.content[locale].slug}>
                  <Link href={guidePath(locale, g)} className="text-foreground underline underline-offset-4 hover:text-primary">
                    {g.content[locale].title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={`/${GUIDE_SEGMENT[kind][locale]}`} className="text-muted-foreground underline underline-offset-4">
                  {kindCopy.hub}
                </Link>
              </li>
            </ul>
          </nav>
        )}
        </div>
      </main>
    </div>
  )
}
