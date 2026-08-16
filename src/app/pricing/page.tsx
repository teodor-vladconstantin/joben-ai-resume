import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Metadata } from 'next'
import { CheckCircle2, FileText, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { PlanCta } from '@/components/pricing/PlanCta'
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

export default async function PricingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
      {/* Navbar */}
      <nav className="h-14 border-b border-border-faint">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-text-primary hover:text-accent transition-colors">
            <FileText size={18} />
            <span className="font-semibold text-heading">Joben</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="inline-flex items-center px-3 py-1.5 bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary text-body rounded-md border border-transparent transition-colors"
            >
              Home
            </Link>
            {userId ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="inline-flex items-center px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h1 className="text-display font-semibold tracking-tight text-text-primary">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-body text-text-secondary">
            Start free. Upgrade when you need AI-powered features.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
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

                <h3 className="text-heading font-medium text-text-primary">{plan.name}</h3>
                <p className="text-text-muted text-xs mt-1">{plan.description}</p>
                <div className="mt-4 mb-6">
                  <span className="text-display text-text-primary font-semibold">{plan.price}</span>
                  <span className="text-body text-text-muted"> {plan.price_period}</span>
                </div>
                <ul className="space-y-2 mb-6 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-start gap-2 text-body text-text-secondary">
                      <CheckCircle2 size={14} className="text-success mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex items-start gap-2 text-body text-text-muted line-through">
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
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-faint py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-text-muted">
            Questions? Contact us at <a href="mailto:duku@joben.eu" className="text-accent hover:underline">duku@joben.eu</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
