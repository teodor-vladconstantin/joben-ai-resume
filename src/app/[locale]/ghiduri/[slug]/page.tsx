import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { siteConfig } from '@/lib/content'
import { GUIDES, getGuide } from '@/data/guides'
import type { AppLocale } from '@/i18n/routing'

// Guides are Romanian-only (see src/data/guides.ts), so the copy around them
// lives here instead of in messages/*.json.
const COPY = {
  eyebrow: 'Ghid',
  answerLabel: 'Pe scurt',
  updated: 'Actualizat',
  faqHeading: 'Întrebări frecvente',
  home: 'Acasă',
  ctaHeading: 'Vezi cum își citește un ATS CV-ul tău',
  ctaBody: 'Încarcă CV-ul și primești gratuit un scor de la 0 la 100 și punctele de reparat. Fără cont.',
  ctaButton: 'Scanează CV-ul gratuit',
}

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}

// Only /ro serves guides; the page itself 404s other locales and unknown
// slugs. (Returning [] for en here made Next prerender nothing at all.)
export const dynamicParams = false

export function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const guide = locale === 'ro' ? getGuide(slug) : undefined
  if (!guide) return {}

  const path = `/ro/ghiduri/${guide.slug}`
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: path,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: guide.title }],
      locale: 'ro_RO',
      type: 'article',
      publishedTime: guide.datePublished,
      modifiedTime: guide.dateModified,
    },
    twitter: { card: 'summary_large_image', title: guide.title, description: guide.description, images: ['/og-image.png'] },
  }
}

export default async function GuidePage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const guide = locale === 'ro' ? getGuide(slug) : undefined
  if (!guide) notFound()

  const path = `/ro/ghiduri/${guide.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: COPY.home, path: '/ro' },
        { name: guide.title, path },
      ]),
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.description,
        inLanguage: 'ro',
        datePublished: guide.datePublished,
        dateModified: guide.dateModified,
        mainEntityOfPage: `${siteConfig.url}${path}`,
        author: { '@id': `${siteConfig.url}/#organization` },
        publisher: { '@id': `${siteConfig.url}/#organization` },
      },
      {
        '@type': 'FAQPage',
        mainEntity: guide.faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
      },
    ],
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pt-32 pb-24 space-y-12">
        <header className="space-y-4">
          <Eyebrow>{COPY.eyebrow}</Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-(--foreground)">{guide.title}</h1>
          <p className="text-xs text-(--muted) font-mono">
            {COPY.updated}: <time dateTime={guide.dateModified}>{guide.dateModified}</time>
          </p>
        </header>

        <Card radius="lg" className="p-6 sm:p-8 space-y-2">
          <p className="text-xs font-mono font-semibold uppercase tracking-wider text-(--muted)">{COPY.answerLabel}</p>
          <p className="text-lg leading-relaxed text-(--foreground)">{guide.answer}</p>
        </Card>

        {guide.sections.map((section) => (
          <section key={section.heading} className="space-y-4">
            <h2 className="text-2xl font-bold text-(--foreground)">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-(--muted) leading-relaxed">
                {paragraph}
              </p>
            ))}
            {section.items && (
              <ul className="list-disc pl-5 space-y-2 text-(--muted) leading-relaxed">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-(--foreground)">{COPY.faqHeading}</h2>
          {guide.faq.map((item) => (
            <div key={item.question} className="space-y-2">
              <h3 className="font-bold text-(--foreground)">{item.question}</h3>
              <p className="text-(--muted) leading-relaxed">{item.answer}</p>
            </div>
          ))}
        </section>

        <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-lg text-(--foreground)">{COPY.ctaHeading}</h2>
            <p className="text-xs text-(--muted) mt-1">{COPY.ctaBody}</p>
          </div>
          <Link
            href="/free-ats-checker"
            className={`shrink-0 ${buttonVariants('primary', 'md')} text-sm font-semibold flex items-center gap-1.5`}
          >
            <span>{COPY.ctaButton}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
