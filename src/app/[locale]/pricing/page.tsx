import { Suspense } from 'react'
import { Check, X } from 'lucide-react'
import { Metadata } from 'next'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { Navbar } from '@/components/ui/Navbar'
import { buttonVariants } from '@/components/ui/Button'
import { PlanCta } from '@/components/pricing/PlanCta'
import { AutoResumeCheckout } from '@/components/pricing/AutoResumeCheckout'
import { pricingPlanMeta, siteConfig } from '@/lib/content'
import { breadcrumbJsonLd } from '@/lib/structured-data'
import type { AppLocale } from '@/i18n/routing'
import { localeAlternates } from '@/lib/locale-alternates'
import type { Messages } from '@/i18n/messages'
import { JsonLd } from '@/components/seo/JsonLd'
import { PageHero, wrap } from '@/components/marketing/section'
import { cn } from '@/lib/cn'
import { TrackOnView } from '@/components/analytics/TrackOnView'

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
    alternates: localeAlternates(locale, '/pricing'),
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
  const { Common, Pricing: pricing } = messages

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
    ],
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={jsonLd} />
      <TrackOnView event="pricing_viewed" />
      <Suspense fallback={null}>
        <AutoResumeCheckout />
      </Suspense>
      <Navbar />

      <main>
        <PageHero eyebrow="Joben" title={pricing.heading} intro={pricing.subheading} />
        <section className="py-12 sm:py-16">
          <div className={wrap}>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {pricing.plans.map((plan, index) => {
                const meta = pricingPlanMeta[index]
                return (
                  <div
                    key={index}
                    className={cn(
                      'relative flex flex-col rounded-xl border bg-card p-6 shadow-card',
                      meta.isPrimary ? 'border-primary ring-1 ring-primary' : 'border-border',
                    )}
                  >
                    {plan.badge ? (
                      <span className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {plan.badge}
                      </span>
                    ) : null}
                    <h2 className="text-lg font-semibold">{plan.name}</h2>
                    <p className="mt-1 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
                    <div className="mt-5 mb-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tabular-nums tracking-[-0.03em]">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.pricePeriod}</span>
                    </div>
                    <ul className="mb-6 grow space-y-2.5">
                      {plan.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-start gap-2 text-sm">
                          <Check size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden />
                          {feature}
                        </li>
                      ))}
                      {plan.excludedFeatures.map((feature, fIndex) => (
                        <li key={`excluded-${fIndex}`} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                          <X size={16} className="mt-0.5 shrink-0" aria-hidden />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <PlanCta
                      label={plan.cta}
                      plan={meta.planId}
                      className={cn('w-full text-center', buttonVariants(meta.isPrimary ? 'primary' : 'outline', 'md'))}
                    />
                  </div>
                )
              })}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{pricing.vatNote}</p>
          </div>
        </section>
      </main>
    </div>
  )
}
