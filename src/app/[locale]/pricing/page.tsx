import { Suspense } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
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

      <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {pricing.heading}
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            {pricing.subheading}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricing.plans.map((plan, index) => {
            const meta = pricingPlanMeta[index]
            return (
              <Card
                key={index}
                elevated={meta.isBestValue}
                radius="lg"
                className={`p-6 flex flex-col relative ${meta.isBestValue ? 'border-(--accent)' : ''}`}
              >
                {meta.isBestValue && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    {Common.bestValue}
                  </Badge>
                )}

                <h3 className="text-xl font-semibold text-(--foreground)">{plan.name}</h3>
                <p className="text-(--muted) text-xs mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl text-(--foreground) font-bold">{plan.price}</span>
                  <span className="text-(--muted)"> {plan.pricePeriod}</span>
                </div>
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-sm text-(--foreground)">
                      <CheckCircle2 size={14} className="text-(--accent) mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex items-start gap-2 text-sm text-(--muted) line-through">
                      <X size={14} className="text-red-400 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <PlanCta
                  label={plan.cta}
                  plan={meta.planId}
                  className={`w-full text-center ${buttonVariants(meta.isBestValue || meta.isPrimary ? 'primary' : 'secondary', 'md')}`}
                />
              </Card>
            )
          })}
        </div>
      </main>
    </div>
  )
}
