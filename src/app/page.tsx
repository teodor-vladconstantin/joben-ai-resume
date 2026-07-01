import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { Metadata } from 'next'
import {
  FileText,
  Sparkles,
  Download,
  Check,
  ArrowRight,
} from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { HeroDataTexture } from '@/components/marketing/HeroDataTexture'

export const metadata: Metadata = {
  title: 'Joben — AI Resume Builder',
  description: 'Create professional, ATS-optimized resumes in minutes with AI. Free to start.',
}

const features = [
  {
    icon: FileText,
    title: 'ATS-Optimized Templates',
    description: 'Clean, professional templates that pass applicant tracking systems and reach human reviewers.',
  },
  {
    icon: Sparkles,
    title: 'AI Resume Review',
    description: 'Get targeted feedback and actionable suggestions to strengthen every section of your resume.',
  },
  {
    icon: Download,
    title: 'Export to PDF & LaTeX',
    description: 'Download polished PDFs ready to send, or export LaTeX source for full control.',
  },
]

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 py-20 sm:py-28">
        <HeroDataTexture />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-muted text-accent border border-accent-border mb-8">
            AI-Powered Resume Builder
          </span>
          <h1 className="text-hero leading-hero font-semibold tracking-hero text-text-primary">
            Build a resume that <span className="text-accent">gets you hired.</span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-body text-text-secondary leading-relaxed">
            Create professional, ATS-optimized resumes in minutes. AI-powered suggestions, proven templates, and real-time scoring — free to start.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href={userId ? '/resumes/new' : '/sign-up'}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-full border border-accent-border transition-colors"
            >
              Build your resume <ArrowRight size={14} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center px-5 py-2.5 bg-transparent hover:bg-bg-hover text-text-secondary hover:text-text-primary text-body rounded-full border border-border-soft transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="py-8 border-y border-border-faint">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-text-muted text-small">
            Trusted by job seekers building better resumes
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className="bg-bg-surface border border-border-soft rounded-lg p-6 animate-fade-in-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <feature.icon size={16} className="text-accent mb-3" />
                <h3 className="text-heading font-medium text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-body text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 border-t border-border-faint">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-title font-semibold text-text-primary text-center mb-10">
            Simple pricing
          </h2>
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
                {[
                  'ATS-optimized templates',
                  'Resume builder',
                  'PDF export',
                  'Cover letter builder',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-body text-text-secondary">
                    <Check size={14} className="text-accent mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={userId ? '/resumes/new' : '/sign-up'}
                className="block w-full text-center px-3 py-1.5 bg-transparent hover:bg-bg-hover text-text-primary text-body rounded-md border border-border-soft transition-colors"
              >
                Get started
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
                {[
                  'Everything in Free',
                  'AI resume review & scoring',
                  'AI content suggestions',
                  'AI-powered cover letters',
                  'LaTeX export',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-body text-text-secondary">
                    <Check size={14} className="text-accent mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/pricing"
                className="block w-full text-center px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-body font-medium rounded-md border border-accent-border transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border-faint py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 text-text-primary mb-3">
                <FileText size={16} />
                <span className="font-semibold text-body">Joben</span>
              </div>
              <p className="text-xs text-text-muted">
                AI-powered resume builder for modern job seekers.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Product</h4>
              <ul className="space-y-1.5">
                <li><Link href="/resumes/new" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Resume Builder</Link></li>
                <li><Link href="/pricing" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-medium text-text-muted uppercase tracking-wide mb-3">Legal</h4>
              <ul className="space-y-1.5">
                <li><Link href="/terms" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="text-xs text-text-muted hover:text-text-secondary transition-colors">Privacy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-faint">
            <p className="text-xs text-text-muted">
              &copy; {new Date().getFullYear()} Joben. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
