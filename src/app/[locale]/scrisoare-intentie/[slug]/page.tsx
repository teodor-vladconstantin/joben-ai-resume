import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import {
  FileText,
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Briefcase,
} from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { BUILD_TIME } from '@/lib/content'
import { routing, type AppLocale } from '@/i18n/routing'
import { SEO_JOBS, getSeoJobBySlug } from '@/data/seo-jobs'
import { SeoAtsScanWidget } from '@/components/seo/SeoAtsScanWidget'

interface PageProps {
  params: Promise<{ locale: AppLocale; slug: string }>
}

export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = []
  for (const locale of routing.locales) {
    for (const job of SEO_JOBS) {
      params.push({ locale, slug: job.slug[locale] })
    }
  }
  return params
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params
  const job = getSeoJobBySlug(slug, locale)
  if (!job) return {}

  const isRo = locale === 'ro'
  const jobTitle = job.title[locale]

  const title = isRo
    ? `Model Scrisoare de Intenție ${jobTitle}: Ghid & Exemple 2026 | Joben`
    : `Cover Letter Example for ${jobTitle}: Templates & Guide 2026 | Joben`

  const description = isRo
    ? `Model complet de scrisoare de intenție pentru ${jobTitle}. Exemple de paragrafe concrete, structură recomandată pentru piața din România și generator AI.`
    : `Tailored cover letter template for ${jobTitle}. Learn how to match key qualifications and stand out to hiring managers.`

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/scrisoare-intentie/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/scrisoare-intentie/${job.slug[l]}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/scrisoare-intentie/${slug}`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isRo ? 'ro_RO' : 'en_US',
      type: 'article',
    },
  }
}

export default async function SeoScrisoareIntentiePage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const job = getSeoJobBySlug(slug, locale)

  if (!job) {
    notFound()
  }

  const isRo = locale === 'ro'
  const jobTitle = job.title[locale]
  const sample = job.coverLetterSample[locale]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: isRo ? 'Acasă' : 'Home', path: `/${locale}` },
        { name: isRo ? 'Scrisori de Intenție' : 'Cover Letters', path: `/${locale}/scrisoare-intentie/${slug}` },
        { name: jobTitle, path: `/${locale}/scrisoare-intentie/${slug}` },
      ]),
      {
        '@type': 'TechArticle',
        headline: `Model Scrisoare de Intenție ${jobTitle}`,
        description: `Ghid și model redactat de scrisoare de intenție pentru ${jobTitle}.`,
        dateModified: BUILD_TIME,
        author: {
          '@type': 'Organization',
          name: 'Joben.eu',
          url: 'https://joben.eu',
        },
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

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Eyebrow>{isRo ? 'MODEL SCRISOARE DE INTENȚIE 2026' : 'COVER LETTER TEMPLATE 2026'}</Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-(--foreground)">
            {isRo ? `Scrisoare de Intenție pentru ${jobTitle}` : `Cover Letter for ${jobTitle}`}
          </h1>
          <p className="text-(--muted) text-lg max-w-2xl mx-auto">
            {isRo
              ? `Un model profesional adaptat cerințelor actuale ale angajatorilor din România, gata de descărcat sau personalizat cu asistentul AI Joben.`
              : `A professional cover letter sample tailored for ${jobTitle} candidates to grab recruiter attention.`}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2">
            <span className="px-3 py-1 rounded-full bg-(--accent-muted) text-xs font-mono font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {isRo ? `Domeniu: ${job.category[locale]}` : `Field: ${job.category[locale]}`}
            </span>
            <span className="px-3 py-1 rounded-full bg-(--surface) border border-(--border) text-xs font-mono font-semibold">
              {isRo ? 'Durată redactare: ~3 minute cu AI' : 'Drafting time: ~3 mins with AI'}
            </span>
          </div>
        </div>

        {/* Interactive ATS Scan Widget */}
        <SeoAtsScanWidget job={job} />

        {/* Ready-to-use Sample Cover Letter */}
        <Card radius="lg" className="p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-(--border)">
            <div>
              <h2 className="text-2xl font-bold text-(--foreground)">
                {isRo ? `Model Complet de Scrisoare pentru ${jobTitle}` : `Sample Letter for ${jobTitle}`}
              </h2>
              <p className="text-xs text-(--muted) mt-1">
                {isRo ? 'Personalizează datele din paranteze cu experiența ta reală.' : 'Customize the bracketed data.'}
              </p>
            </div>
            <Link
              href={`/${locale}/cover-letters`}
              className={`shrink-0 ${buttonVariants('primary', 'sm')} text-xs font-semibold flex items-center gap-1.5`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isRo ? 'Generează Automat cu AI' : 'Generate with AI'}</span>
            </Link>
          </div>

          <div className="p-6 rounded-xl bg-(--surface) border border-(--border) space-y-4 font-sans text-sm text-(--foreground)/90 leading-relaxed">
            <p className="font-semibold text-(--foreground)">{sample.intro}</p>
            <p>{sample.body}</p>
            <p>{sample.closing}</p>
            <div className="pt-2 text-xs text-(--muted) font-mono">
              [Numele și Prenumele Tău] &bull; [Număr de Telefon] &bull; [Link Profil LinkedIn]
            </div>
          </div>
        </Card>

        {/* 3 Golden Rules for Cover Letters */}
        <Card radius="lg" className="p-8 space-y-6">
          <h2 className="text-2xl font-bold text-(--foreground)">
            {isRo ? '3 Reguli pentru o Scrisoare de Intenție de Succes' : '3 Rules for an Irresistible Cover Letter'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="space-y-2">
              <span className="h-7 w-7 rounded-full bg-(--foreground) text-(--background) font-bold text-xs flex items-center justify-center font-mono">
                1
              </span>
              <h3 className="font-bold text-sm text-(--foreground)">
                {isRo ? 'Nu repeta mot-a-mot CV-ul' : 'Do not simply repeat your resume'}
              </h3>
              <p className="text-xs text-(--muted)">
                {isRo
                  ? 'Scrisoarea trebuie să explice motivația și contextul marilor tale reușite, nu doar să relisteze joburile trecute.'
                  : 'Explain the motivations and context behind your proudest career achievements.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="h-7 w-7 rounded-full bg-(--foreground) text-(--background) font-bold text-xs flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="font-bold text-sm text-(--foreground)">
                {isRo ? 'Concentrează-te pe nevoile lor' : 'Focus on the employer’s needs'}
              </h3>
              <p className="text-xs text-(--muted)">
                {isRo
                  ? 'Arată exact cum experiența ta va rezolva o problemă concretă cu care se confruntă compania angajatoare.'
                  : 'Demonstrate how your background directly solves current challenges the company faces.'}
              </p>
            </div>

            <div className="space-y-2">
              <span className="h-7 w-7 rounded-full bg-(--foreground) text-(--background) font-bold text-xs flex items-center justify-center font-mono">
                3
              </span>
              <h3 className="font-bold text-sm text-(--foreground)">
                {isRo ? 'Păstrează lungimea sub o pagină' : 'Keep it strictly under 1 page'}
              </h3>
              <p className="text-xs text-(--muted)">
                {isRo
                  ? 'Trei sau patru paragrafe aerisite (250-350 de cuvinte) sunt suficiente pentru a stârni curiozitatea recrutorului.'
                  : 'Three concise paragraphs (250-350 words) are the sweet spot for maximum readership.'}
              </p>
            </div>
          </div>
        </Card>

        {/* Link back to CV Example */}
        <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-(--foreground)">
              {isRo ? `Vrei să vezi și modelul de CV pentru ${jobTitle}?` : `Looking for the ${jobTitle} Resume Example?`}
            </h3>
            <p className="text-xs text-(--muted) mt-1">
              {isRo
                ? 'Accesează lista de cuvinte cheie ATS și ghidul complet de CV.'
                : 'Check our full list of ATS keywords and formatting guidelines.'}
            </p>
          </div>
          <Link
            href={`/${locale}/cv/${job.slug[locale]}`}
            className={`shrink-0 ${buttonVariants('secondary', 'md')} text-sm font-semibold flex items-center gap-1.5`}
          >
            <span>{isRo ? 'Vezi Modelul de CV' : 'View Resume Example'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
