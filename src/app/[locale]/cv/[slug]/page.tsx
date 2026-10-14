import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Briefcase,
  Check,
  Sparkles,
} from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { BUILD_TIME, siteConfig } from '@/lib/content'
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
    ? `Model CV ${jobTitle} Optimizat ATS: Exemple & Cuvinte Cheie 2026 | Joben`
    : `ATS Resume Example for ${jobTitle}: Keywords & Guide 2026 | Joben`

  const description = isRo
    ? `Ghid complet și model de CV pentru ${jobTitle} optimizat pentru filtrele ATS din România. Descoperă cuvintele cheie obligatorii, salariul estimat (${job.salaryRangeRo}) și exemple de puncte puternice.`
    : `Complete ATS resume guide for ${jobTitle}. Essential keywords, formatting rules, and bullet point rewrites to pass recruiter screeners.`

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/cv/${slug}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `/${l}/cv/${job.slug[l]}`])
      ),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/cv/${slug}`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
      locale: isRo ? 'ro_RO' : 'en_US',
      type: 'article',
    },
  }
}

export default async function SeoCvPage({ params }: PageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const job = getSeoJobBySlug(slug, locale)

  if (!job) {
    notFound()
  }

  const isRo = locale === 'ro'
  const jobTitle = job.title[locale]
  const currentYear = 2026

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: isRo ? 'Acasă' : 'Home', path: `/${locale}` },
        { name: isRo ? 'Modele CV' : 'Resume Examples', path: `/${locale}/cv/${slug}` },
        { name: jobTitle, path: `/${locale}/cv/${slug}` },
      ]),
      {
        '@type': 'TechArticle',
        headline: `Model de CV ${jobTitle} Optimizat ATS`,
        description: `Ghid cuprinzător de redactare și optimizare a CV-ului pentru ${jobTitle}.`,
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
          <Eyebrow>{isRo ? `GHID DE CARIERĂ & CV ATS ${currentYear}` : `CAREER & ATS GUIDE ${currentYear}`}</Eyebrow>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-(--foreground)">
            {isRo ? `Model CV pentru ${jobTitle}` : `Resume Example for ${jobTitle}`}
          </h1>
          <p className="text-(--muted) text-lg max-w-2xl mx-auto">
            {isRo
              ? `Află cum să îți structurezi CV-ul de ${jobTitle} pentru a trece de filtrele automate ATS și a obține interviuri la companiile din România.`
              : `Learn how to tailor your ${jobTitle} resume with ATS keywords to pass applicant tracking filters and secure high-impact interviews.`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <span className="px-3 py-1 rounded-full bg-(--accent-muted) text-xs font-mono font-semibold flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              {isRo ? `Categorie: ${job.category[locale]}` : `Category: ${job.category[locale]}`}
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-mono font-semibold flex items-center gap-1.5 border border-emerald-500/20">
              <TrendingUp className="h-3.5 w-3.5" />
              {isRo ? `Nivel Căutare: ${job.demandLevelRo}` : `Demand: High`}
            </span>
            <span className="px-3 py-1 rounded-full bg-(--surface) border border-(--border) text-xs font-mono font-semibold">
              {isRo ? `Salariu estimat: ${job.salaryRangeRo}` : `Est. Salary: Competitive`}
            </span>
          </div>
        </div>

        {/* Interactive ATS Scan Widget */}
        <SeoAtsScanWidget job={job} />

        {/* Section 1: Required ATS Keywords */}
        <Card radius="lg" className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-(--foreground)">
              {isRo ? `Cuvinte Cheie ATS Obligatorii pentru ${jobTitle}` : `Essential ATS Keywords for ${jobTitle}`}
            </h2>
            <p className="text-sm text-(--muted) mt-1">
              {isRo
                ? 'Roboții ATS caută acești termeni specifici în CV-ul tău. Lipsa lor te poate descalifica automat.'
                : 'Recruitment algorithms look for these terms. Make sure they are organically integrated into your work history.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-(--foreground)">
                {isRo ? 'Competențe Tehnice & Hard Skills' : 'Technical & Hard Skills'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.keywords.hardSkills[locale].map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-(--surface) border border-(--border) text-xs font-medium text-(--foreground)"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-(--foreground)">
                {isRo ? 'Aptitudini & Soft Skills' : 'Interpersonal & Soft Skills'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.keywords.softSkills[locale].map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-(--surface) border border-(--border) text-xs font-medium text-(--foreground)"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-(--foreground)">
                {isRo ? 'Unelte & Tehnologii uzuale' : 'Tools & Environments'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.keywords.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-(--accent-muted) font-mono text-xs font-semibold text-(--foreground)"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-(--foreground)">
                {isRo ? 'Certificări Recomandate' : 'Recommended Certifications'}
              </h3>
              <div className="flex flex-wrap gap-2">
                {job.keywords.certifications[locale].map((cert, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-medium"
                  >
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Before & After Bullet Points */}
        <Card radius="lg" className="p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-(--foreground)">
              {isRo ? 'Exemplu Rescriere: De la Punct Slab la Punct Puternic' : 'Bullet Rewrite: Weak vs. Strong'}
            </h2>
            <p className="text-sm text-(--muted) mt-1">
              {isRo
                ? 'Sistemele ATS dau un ranking superior CV-urilor cu realizări măsurabile și verbe de acțiune.'
                : 'Algorithms score quantifiable achievements and strong action verbs dramatically higher.'}
            </p>
          </div>

          <div className="space-y-4">
            {job.bulletExamples.map((ex, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-rose-500 font-bold text-xs uppercase tracking-wider font-mono">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{isRo ? 'Formulare Slabă (Fără impact)' : 'Weak Bullet (No impact)'}</span>
                  </div>
                  <p className="text-sm text-(--foreground)">&ldquo;{ex.weak[locale]}&rdquo;</p>
                  <p className="text-xs text-(--muted)">
                    {isRo
                      ? 'Lipsește contextul, cifra sau rezultatul obținut. ATS-ul o evaluează drept generică.'
                      : 'Missing metrics, business scale, or measurable outcomes.'}
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-wider font-mono">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isRo ? 'Formulare Optimizată ATS' : 'ATS-Optimized Bullet'}</span>
                  </div>
                  <p className="text-sm font-medium text-(--foreground)">&ldquo;{ex.strong[locale]}&rdquo;</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">
                    {isRo
                      ? 'Conține unelte, cifre procentuale și rezultatul exact asupra afacerii.'
                      : 'Contains specific tools, quantified improvements, and business impact.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Section 3: ATS Checklist */}
        <Card radius="lg" className="p-8 space-y-4">
          <h2 className="text-2xl font-bold text-(--foreground)">
            {isRo ? `Checklist ATS pentru CV-ul de ${jobTitle}` : `ATS Checklist for ${jobTitle}`}
          </h2>
          <ul className="space-y-3 pt-2">
            {job.atsChecklist[locale].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-(--foreground)">
                <Check className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Cross-Link to Cover Letter */}
        <div className="p-6 rounded-2xl border border-(--border) bg-(--surface) flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-(--foreground)">
              {isRo ? `Ai nevoie și de Scrisoare de Intenție pentru ${jobTitle}?` : `Need a Cover Letter for ${jobTitle}?`}
            </h3>
            <p className="text-xs text-(--muted) mt-1">
              {isRo
                ? 'Vezi modelul de scrisoare redactat special pentru a complementa acest CV.'
                : 'See our tailored cover letter template and recruiter talking points.'}
            </p>
          </div>
          <Link
            href={`/${locale}/scrisoare-intentie/${job.slug[locale]}`}
            className={`shrink-0 ${buttonVariants('secondary', 'md')} text-sm font-semibold flex items-center gap-1.5`}
          >
            <span>{isRo ? 'Vezi Scrisoarea de Intenție' : 'View Cover Letter'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Bottom CTA to Joben Builder */}
        <div className="p-8 rounded-2xl bg-(--accent-muted)/30 border border-(--foreground)/20 text-center space-y-4">
          <Sparkles className="h-8 w-8 mx-auto text-(--foreground)" />
          <h3 className="text-2xl font-bold text-(--foreground)">
            {isRo ? `Construiește-ți CV-ul de ${jobTitle} în 5 Minute` : `Build Your ${jobTitle} Resume in 5 Minutes`}
          </h3>
          <p className="text-sm text-(--muted) max-w-xl mx-auto">
            {isRo
              ? 'Folosește șabloanele pre-optimizate Joben.eu concepute special pentru a trece de softurile ATS din România.'
              : 'Use our AI editor with ATS-compliant templates to stand out and get hired.'}
          </p>
          <div className="pt-2">
            <Link
              href={`/${locale}/resumes`}
              className={`px-8 py-3.5 text-base font-semibold ${buttonVariants('primary', 'lg')} shadow-lg`}
            >
              {isRo ? 'Creează CV-ul Tău Gratuit' : 'Create Your Free Resume'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
