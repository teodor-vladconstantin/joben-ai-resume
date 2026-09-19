import { Suspense } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
import { PlanCta } from '@/components/pricing/PlanCta'
import { AutoResumeCheckout } from '@/components/pricing/AutoResumeCheckout'
import { pricingPlanMeta, siteConfig } from '@/lib/content'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import { routing, type AppLocale } from '@/i18n/routing'
import type { Messages } from '@/i18n/messages'

function priceAmount(price: string): string {
  return price.replace(/[^\d]/g, '')
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: AppLocale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Metadata.pricing' })
  const title = t('title')
  const description = t('description')

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/pricing`,
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}/pricing`])),
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/pricing`,
      siteName: 'Joben',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Joben AI Resume Builder' }],
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

export default async function PricingPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, Pricing: pricing, Faq: faq } = messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${siteConfig.url}/${locale}/pricing/#webpage`,
        url: `${siteConfig.url}/${locale}/pricing`,
        name: pricing.heading,
        description: messages.Metadata.pricing.description,
        isPartOf: { '@id': `${siteConfig.url}/#website` },
      },
      breadcrumbJsonLd([
        { name: Common.home, path: `/${locale}` },
        { name: pricing.heading, path: `/${locale}/pricing` },
      ]),
      ...pricing.plans.map((plan, index) => ({
        '@type': 'Product',
        name: `Joben ${plan.name}`,
        description: plan.description,
        brand: { '@id': `${siteConfig.url}/#organization` },
        offers: {
          '@type': 'Offer',
          price: priceAmount(plan.price),
          priceCurrency: 'RON',
          url: `${siteConfig.url}/${locale}/pricing`,
          availability: 'https://schema.org/InStock',
        },
        category: pricingPlanMeta[index].planId ?? 'free',
      })),
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
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
      <Suspense fallback={null}>
        <AutoResumeCheckout />
      </Suspense>
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto pt-32 pb-24">
        <div className="mb-12 max-w-xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {pricing.heading}
          </h1>
          <p className="mt-4 text-(--muted) text-lg">
            {pricing.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) md:grid-cols-3 md:divide-x md:divide-y-0">
          {pricing.plans.map((plan, index) => {
            const meta = pricingPlanMeta[index]
            return (
              <div
                key={index}
                className={`flex flex-col p-6 ${meta.isBestValue ? 'bg-(--accent-muted)' : ''}`}
              >
                {meta.isBestValue && (
                  <p className="mb-4 font-mono text-(length:--text-label) text-(--foreground)">{Common.bestValue}</p>
                )}

                <h3 className="text-xl font-semibold text-(--foreground)">{plan.name}</h3>
                <p className="text-(--muted) text-xs mt-1">{plan.description}</p>
                <div className="mt-4 mb-6 font-mono">
                  <span className="text-3xl text-(--foreground) font-bold tabular-nums">{plan.price}</span>
                  <span className="font-sans text-(--muted)"> {plan.pricePeriod}</span>
                </div>
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-sm text-(--foreground)">
                      <CheckCircle2 size={14} className="text-(--foreground) mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex items-start gap-2 text-sm text-(--muted) line-through">
                      <X size={14} className="text-(--muted) mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <PlanCta
                  label={plan.cta}
                  plan={meta.planId}
                  className={`w-full text-center ${buttonVariants(meta.isBestValue || meta.isPrimary ? 'primary' : 'secondary', 'md')}`}
                />
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
