import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Navbar } from '@/components/ui/Navbar'
import { Card } from '@/components/ui/Card'
import { Badge, Eyebrow } from '@/components/ui/Badge'
import { buttonVariants } from '@/components/ui/Button'
import { getResumeRole, resumeRoles } from '@/data/resume-roles'

// A couple of role titles are generic categories (e.g. "Entry-Level",
// "Internship") that start with a vowel sound, so "a {title} resume" reads
// wrong ("a entry-level resume"). Pick the article dynamically instead of
// hardcoding "a" in the copy below.
function articleFor(word: string): 'a' | 'an' {
  return /^[aeiou]/i.test(word) ? 'an' : 'a'
}

// Only the roles in resume-roles.ts are valid; an unlisted slug should 404,
// not attempt an on-demand render with no matching content.
export const dynamicParams = false

export function generateStaticParams() {
  return resumeRoles.map((role) => ({ slug: role.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const role = getResumeRole(slug)
  if (!role) return {}

  const title = `${role.title} Resume Examples & ATS Keywords | Joben`
  const description = `See real ${role.title} resume bullet examples, the exact ATS keywords recruiters scan for, and the most common mistakes to avoid. Free ATS resume checker included.`

  return {
    title,
    description,
    alternates: {
      canonical: `/resume-examples/${role.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/resume-examples/${role.slug}`,
      siteName: 'Joben',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${role.title} Resume Examples, Joben`,
        },
      ],
      locale: 'en_US',
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

export default async function ResumeRolePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const role = getResumeRole(slug)
  if (!role) notFound()

  const roleLower = role.title.toLowerCase()
  const article = articleFor(roleLower)

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <Navbar />

      <main className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-32 pb-24">
        <div className="text-center mb-12">
          <Eyebrow>Free Resume Examples</Eyebrow>
          <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight text-(--foreground)">
            {role.title} Resume Examples & ATS Keywords
          </h1>
          <p className="mt-4 text-(--muted) max-w-2xl mx-auto text-lg">
            What ATS software and recruiters look for on {article} {roleLower} resume: the exact keywords to
            include, the mistakes that get resumes rejected, and a real bullet-point rewrite.
          </p>
        </div>

        <div className="space-y-8">
          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-1">
              Keywords ATS software scans for
            </h2>
            <p className="text-(--muted) text-sm mb-5">
              Include the ones that genuinely match your background, don&apos;t keyword-stuff.
            </p>
            <div className="flex flex-wrap gap-2">
              {role.keywords.map((keyword) => (
                <Badge key={keyword} variant="muted">
                  {keyword}
                </Badge>
              ))}
            </div>
          </Card>

          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-5">
              Common {role.title} resume mistakes
            </h2>
            <ul className="space-y-4">
              {role.commonMistakes.map((mistake, index) => (
                <li key={index} className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-(--accent) mt-0.5" />
                  <p className="text-(--muted) text-sm">{mistake}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card radius="lg" className="p-6 sm:p-8">
            <h2 className="text-(--foreground) font-bold text-lg mb-5">
              Weak vs. strong bullet example
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-(--border) bg-(--surface) p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--muted) mb-2">
                  <XCircle className="h-4 w-4" /> Weak
                </p>
                <p className="text-sm text-(--foreground)">{role.weakBullet}</p>
              </div>
              <div className="rounded-xl border border-(--accent)/30 bg-(--accent-muted) p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-(--accent) mb-2">
                  <CheckCircle2 className="h-4 w-4" /> Strong
                </p>
                <p className="text-sm text-(--foreground)">{role.strongBullet}</p>
              </div>
            </div>
          </Card>

          <Card elevated radius="lg" className="p-6 sm:p-8 text-center">
            <p className="text-(--foreground) font-semibold text-lg">
              How does your {role.title.toLowerCase()} resume actually score?
            </p>
            <p className="text-(--muted) text-sm mt-1.5 max-w-md mx-auto">
              Upload it and get a free ATS score, a category breakdown, and specific fixes, in seconds, no signup.
            </p>
            <Link href="/free-ats-checker" className={`mt-5 inline-flex ${buttonVariants('primary', 'md')}`}>
              Check My {role.title} Resume, Free
            </Link>
          </Card>
        </div>
      </main>
    </div>
  )
}
