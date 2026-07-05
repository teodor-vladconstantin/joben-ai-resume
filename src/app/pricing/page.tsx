import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Metadata } from 'next'
import { Check, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
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
        <div className="max-w-3xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-bg-surface border border-border-soft rounded-lg p-6">
              <h3 className="text-heading font-medium text-text-primary">Free</h3>
              <p className="text-text-muted text-xs mt-1">Get started with the basics</p>
              <div className="mt-4 mb-6">
                <span className="text-display text-text-primary font-semibold">€0</span>
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
                <Button variant="secondary" className="w-full">
                  Get started
                </Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-bg-surface border border-accent-border rounded-lg p-6 relative">
              <span className="absolute -top-2.5 left-4 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-muted text-accent border border-accent-border">
                Pro
              </span>
              <h3 className="text-heading font-medium text-text-primary">Pro</h3>
              <p className="text-text-muted text-xs mt-1">Unlock AI-powered features</p>
              <div className="mt-4 mb-6">
                <span className="text-display text-text-primary font-semibold">€9</span>
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
            Questions? Contact us at <a href="mailto:duku@joben.eu" className="text-accent hover:underline">duku@joben.eu</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
