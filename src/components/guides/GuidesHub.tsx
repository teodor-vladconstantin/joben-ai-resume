import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { Navbar } from '@/components/ui/Navbar'
import { PageHero, wrap } from '@/components/marketing/section'
import { cn } from '@/lib/cn'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { siteConfig } from '@/lib/content'
import { GUIDE_SEGMENT, guidePath, guidesOfKind, type GuideKind } from '@/data/guides'
import { routing, type AppLocale } from '@/i18n/routing'

const HUB_COPY: Record<GuideKind, Record<AppLocale, { eyebrow: string; title: string; description: string; intro: string }>> = {
  guide: {
    ro: {
      eyebrow: 'Ghiduri',
      title: 'Ghiduri pentru CV și scrisoarea de intenție',
      description:
        'Ghiduri practice pentru CV, scrisoare de intenție și ATS: format, cuvinte cheie, structură și greșelile care costă interviuri.',
      intro:
        'Ghiduri scurte, cu răspunsul direct la început, despre cum scrii un CV și o scrisoare pe care le citesc și sistemele ATS, și recrutorii.',
    },
    en: {
      eyebrow: 'Guides',
      title: 'Resume and cover letter guides',
      description:
        'Practical guides to resumes, cover letters and ATS: format, keywords, structure and the mistakes that cost interviews.',
      intro:
        'Short guides with the direct answer first, on writing a resume and cover letter that both ATS software and recruiters read well.',
    },
  },
  glossary: {
    ro: {
      eyebrow: 'Glosar',
      title: 'Glosar de recrutare și CV',
      description: 'Definiții scurte pentru termenii din recrutare: ATS, parsare, cuvinte cheie, CV funcțional, Europass și altele.',
      intro: 'Termenii pe care îi întâlnești când aplici la joburi, explicați în două-trei propoziții, cu exemple.',
    },
    en: {
      eyebrow: 'Glossary',
      title: 'Hiring and resume glossary',
      description: 'Short definitions of hiring terms: ATS, parsing, keywords, functional resume, Europass and more.',
      intro: 'The terms you meet when applying for jobs, explained in two or three sentences with examples.',
    },
  },
  compare: {
    ro: {
      eyebrow: 'Comparații',
      title: 'Comparații între instrumente de CV',
      description: 'Joben comparat cu alte instrumente pentru CV: ce face fiecare, prețuri și pentru cine se potrivește.',
      intro: 'Comparații scrise onest, cu punctele în care alternativele sunt mai bune și cele în care alege Joben.',
    },
    en: {
      eyebrow: 'Comparisons',
      title: 'Resume tool comparisons',
      description: 'Joben compared with other resume tools: what each does, pricing and who each one suits.',
      intro: 'Honest comparisons, including where the alternatives are the better pick.',
    },
  },
}

const hubPath = (kind: GuideKind, locale: AppLocale) => `/${locale}/${GUIDE_SEGMENT[kind][locale]}`

export function hubMetadata(kind: GuideKind, locale: AppLocale): Metadata {
  const copy = HUB_COPY[kind][locale]
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical: hubPath(kind, locale),
      languages: {
        ...Object.fromEntries(routing.locales.map((l) => [l, hubPath(kind, l)])),
        'x-default': hubPath(kind, routing.defaultLocale),
      },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      url: hubPath(kind, locale),
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: copy.title }],
      locale: locale === 'ro' ? 'ro_RO' : 'en_US',
      type: 'website',
    },
  }
}

export function GuidesHub({ kind, locale }: { kind: GuideKind; locale: AppLocale }) {
  const copy = HUB_COPY[kind][locale]
  const items = guidesOfKind(kind)
  const path = hubPath(kind, locale)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: locale === 'ro' ? 'Acasă' : 'Home', path: `/${locale}` },
        { name: copy.title, path },
      ]),
      {
        '@type': 'CollectionPage',
        name: copy.title,
        description: copy.description,
        inLanguage: locale,
        url: `${siteConfig.url}${path}`,
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: items.map((guide, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            url: `${siteConfig.url}/${locale}${guidePath(locale, guide)}`,
            name: guide.content[locale].title,
          })),
        },
      },
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main>
        <PageHero eyebrow={copy.eyebrow} title={copy.title} intro={copy.intro} />
        <section className="py-12 sm:py-16">
          <div className={cn(wrap, 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3')}>
            {items.map((guide) => {
              const content = guide.content[locale]
              return (
                <Link
                  key={content.slug}
                  href={guidePath(locale, guide)}
                  className="flex h-full flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
                >
                  <h2 className="text-lg font-semibold">{content.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{content.description}</p>
                </Link>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
