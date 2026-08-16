import type { Metadata } from 'next'
import { Navbar } from '@/components/ui/Navbar'
import { FreeAtsCheckerClient } from './FreeAtsCheckerClient'

export const metadata: Metadata = {
  title: 'Free ATS Resume Checker: No Signup Required | Joben',
  description:
    'Scan your resume against real ATS software in seconds. Get a free 0-100 score, a 4-category breakdown, and specific fixes: no signup, no credit card, 3 free scans a day.',
  alternates: {
    canonical: '/free-ats-checker',
  },
  openGraph: {
    title: 'Free ATS Resume Checker: No Signup Required',
    description: 'Scan your resume against real ATS software in seconds. Free score, free breakdown, no account needed.',
    url: '/free-ats-checker',
    siteName: 'Joben',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Joben Free ATS Resume Checker',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free ATS Resume Checker: No Signup Required',
    description: 'Scan your resume against real ATS software in seconds. Free score, free breakdown, no account needed.',
    images: ['/og-image.png'],
  },
}

export default function FreeAtsCheckerPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wide text-(--accent)">
            <span className="h-1.5 w-1.5 rounded-full bg-(--accent)" aria-hidden="true" />
            Free ATS Resume Checker
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            Free ATS Resume Checker: No Signup Required
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            Upload your resume and see exactly what ATS software and recruiters see: a score out of 100,
            a category breakdown, and specific fixes. No account, no credit card, 3 free scans a day.
          </p>
        </div>

        <FreeAtsCheckerClient />
      </main>
    </div>
  )
}
