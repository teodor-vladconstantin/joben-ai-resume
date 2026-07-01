import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Metadata } from 'next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Eyebrow } from '@/components/ui/Eyebrow'
import { Navbar } from '@/components/ui/Navbar'
import { UpgradeToProButton } from '@/components/pricing/UpgradeToProButton'

export const metadata: Metadata = {
  title: 'Pricing | Joben AI Resume Builder',
  description: 'Free and Pro plans for AI-powered resume building. Start free, upgrade when you need AI features.',
  alternates: {
    canonical: '/pricing',
  },
}

const freeFeatures = [
  'ATS-optimized templates',
  'Resume builder',
  'PDF export',
  'Cover letter builder',
  'Unlimited resumes',
]

const proFeatures = [
  'Everything in Free',
  'AI resume review & scoring',
  'AI content suggestions',
  'AI-powered cover letters',
  'LaTeX export',
  'Priority support',
]

export default async function PricingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <Eyebrow className="justify-center mb-3">Pricing</Eyebrow>
          <h1 className="text-4xl sm:text-5xl leading-tight font-semibold tracking-hero text-text-primary">
            Simple, transparent pricing
          </h1>
          <p className="mt-3 text-body text-text-secondary">
            Start free. Upgrade when you need AI-powered features.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up">
              <h3 className="text-heading font-medium text-text-primary">Free</h3>
              <p className="text-text-muted text-xs mt-1">Get started with the basics</p>
              <div className="mt-4 mb-6">
                <span className="text-display text-text-primary font-semibold">$0</span>
                <span className="text-body text-text-muted"> /month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {freeFeatures.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-body text-text-secondary">
                    <Check size={14} className="text-success mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? '/resumes/new' : '/sign-up'}
                className="block w-full text-center"
              >
                <Button variant="outline" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div
              className="bg-bg-surface border border-accent-border rounded-lg p-6 relative animate-fade-in-up"
              style={{ animationDelay: '60ms' }}
            >
              <span className="absolute -top-2.5 left-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-muted text-accent border border-accent-border">
                Pro
              </span>
              <h3 className="text-heading font-medium text-text-primary">Pro</h3>
              <p className="text-text-muted text-xs mt-1">Unlock AI-powered features</p>
              <div className="mt-4 mb-6">
                <span className="text-display text-text-primary font-semibold">$9</span>
                <span className="text-body text-text-muted"> /month</span>
              </div>
              <ul className="space-y-2 mb-6">
                {proFeatures.map(feature => (
                  <li key={feature} className="flex items-start gap-2 text-body text-text-secondary">
                    <Check size={14} className="text-success mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="block w-full text-center">
                <UpgradeToProButton signedIn={Boolean(userId)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-faint py-8">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs text-text-muted">
            Questions? Contact us at <a href="mailto:admin@joben.eu" className="text-accent hover:underline">admin@joben.eu</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
