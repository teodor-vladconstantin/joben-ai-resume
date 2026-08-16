import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Eyebrow } from '@/components/ui/Badge'
import { resumeRoles } from '@/data/resume-roles'

export const metadata: Metadata = {
  title: 'Resume Examples & ATS Keywords by Role | Joben',
  description:
    'Browse real resume examples, ATS keywords, and common mistakes by job title, from Data Analyst to Registered Nurse. Free ATS resume checker included.',
  alternates: {
    canonical: '/resume-examples',
  },
  openGraph: {
    title: 'Resume Examples & ATS Keywords by Role',
    description: 'Real resume examples, ATS keywords, and common mistakes, organized by job title.',
    url: '/resume-examples',
    siteName: 'Joben',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Resume Examples by Role, Joben',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resume Examples & ATS Keywords by Role',
    description: 'Real resume examples, ATS keywords, and common mistakes, organized by job title.',
    images: ['/og-image.png'],
  },
}

export default function ResumeExamplesIndexPage() {
  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <Eyebrow>Free Resume Examples</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            Resume Examples & ATS Keywords by Role
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            Pick your role to see the exact keywords ATS software scans for, the mistakes that get resumes
            rejected, and a real weak-to-strong bullet rewrite.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumeRoles.map((role) => (
            <Link key={role.slug} href={`/resume-examples/${role.slug}`}>
              <Card radius="lg" className="p-6 h-full transition-colors hover:border-(--accent)/50">
                <p className="text-(--foreground) font-semibold">{role.title}</p>
                <p className="mt-1.5 text-sm text-(--muted)">
                  {role.keywords.slice(0, 3).join(', ')}
                </p>
                <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-(--accent)">
                  See examples <ArrowRight className="h-3.5 w-3.5" />
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
