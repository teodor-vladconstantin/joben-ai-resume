import { Suspense } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Metadata } from 'next'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { PlanCta } from '@/components/pricing/PlanCta'
import { AutoResumeCheckout } from '@/components/pricing/AutoResumeCheckout'
import { pricingPlans } from '@/lib/content'

export const metadata: Metadata = {
  title: 'Pricing | Joben AI Resume Builder',
  description: 'Free, Pro, and Recruiting plans for AI-powered resume building. Start free, upgrade when you need AI features.',
  alternates: {
    canonical: '/pricing',
  },
  openGraph: {
    title: 'Pricing | Joben AI Resume Builder',
    description: 'Free, Pro, and Recruiting plans for AI-powered resume building. Start free, upgrade when you need AI features.',
    url: '/pricing',
    siteName: 'Joben',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Joben AI Resume Builder',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing | Joben AI Resume Builder',
    description: 'Free, Pro, and Recruiting plans for AI-powered resume building. Start free, upgrade when you need AI features.',
    images: ['/og-image.png'],
  },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Suspense fallback={null}>
        <AutoResumeCheckout />
      </Suspense>
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            Start free. Upgrade when you need AI-powered features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan, index) => (
            <Card
              key={index}
              elevated={plan.isBestValue}
              radius="lg"
              className={`p-6 flex flex-col relative ${plan.isBestValue ? 'border-(--accent)' : ''}`}
            >
              {plan.isBestValue && (
                <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  Best Value
                </Badge>
              )}

              <h3 className="text-xl font-semibold text-(--foreground)">{plan.name}</h3>
              <p className="text-(--muted) text-xs mt-1">{plan.description}</p>
              <div className="mt-4 mb-6">
                <span className="text-3xl text-(--foreground) font-bold">{plan.price}</span>
                <span className="text-(--muted)"> {plan.price_period}</span>
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
                plan={plan.planId}
                className={`w-full text-center ${buttonVariants(plan.isBestValue || plan.isPrimary ? 'primary' : 'secondary', 'md')}`}
              />
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
