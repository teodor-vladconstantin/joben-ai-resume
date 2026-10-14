import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { Eyebrow } from '@/components/ui/Badge'
import { VerificareCvClient } from './VerificareCvClient'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { BUILD_TIME, siteConfig } from '@/lib/content'
import { routing, type AppLocale } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const isRo = locale === 'ro'

  const title = isRo
    ? 'Verificare CV ATS Gratuită: Scanează-ți CV-ul Instant | Joben'
    : 'Free ATS Resume Checker: Instant Resume Scanner | Joben'

  const description = isRo
    ? 'Verifică dacă CV-ul tău trece de filtrele automate ATS folosite de angajatorii din România. Analiză pe 4 categorii, scor instant de la 0 la 100 și identificarea celor mai critice erori de formatare.'
    : 'Check if your resume passes automated ATS filters. Get an instant score from 0 to 100, a 4-category analysis, and actionable fixes.'

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/verificare-cv`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/verificare-cv`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/verificare-cv`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben Verificare CV ATS' }],
      locale: isRo ? 'ro_RO' : 'en_US',
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

export default async function VerificareCvPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const isRo = locale === 'ro'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      breadcrumbJsonLd([
        { name: isRo ? 'Acasă' : 'Home', path: `/${locale}` },
        { name: isRo ? 'Verificare CV ATS' : 'ATS Resume Checker', path: `/${locale}/verificare-cv` },
      ]),
      {
        '@type': 'WebApplication',
        name: 'Joben Verificare CV ATS',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        description: isRo
          ? 'Scanner ATS gratuit pentru CV-uri. Analiză rapidă a compatibilității cu filtrele de recrutare.'
          : 'Free ATS resume checker. Fast compatibility analysis with hiring filters.',
        dateModified: BUILD_TIME,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RON',
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

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24">
        <div className="text-center mb-10">
          <Eyebrow>{isRo ? 'SCANNER ATS GRATUIT & INSTANT' : 'FREE & INSTANT ATS SCANNER'}</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {isRo ? 'Verifică dacă CV-ul Tău Trece de Filtrele ATS' : 'Check if Your Resume Passes ATS Filters'}
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-base sm:text-lg">
            {isRo
              ? 'Peste 75% dintre CV-uri sunt respinse automat de sistemele de recrutare înainte să fie citite de un om. Încarcă fișierul PDF sau DOCX și află scorul în mai puțin de 1 secundă.'
              : 'Over 75% of resumes are automatically filtered out by recruitment systems before being seen by a recruiter. Upload your PDF or DOCX file to see your score in less than 1 second.'}
          </p>
        </div>

        <VerificareCvClient />
      </main>
    </div>
  )
}
