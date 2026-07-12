import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy | Joben AI Resume Builder',
  description: 'Learn what cookies Joben uses, why, and how to control them.',
  alternates: {
    canonical: '/cookies',
  },
  openGraph: {
    title: 'Cookie Policy | Joben AI Resume Builder',
    description: 'Learn what cookies Joben uses, why, and how to control them.',
    url: '/cookies',
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
    title: 'Cookie Policy | Joben AI Resume Builder',
    description: 'Learn what cookies Joben uses, why, and how to control them.',
    images: ['/og-image.png'],
  },
}

const lastUpdated = 'July 12, 2026'

type CookieRow = {
  name: string
  provider: string
  purpose: string
  duration: string
}

const necessaryCookies: CookieRow[] = [
  { name: '__session', provider: 'Clerk', purpose: 'Keeps you signed in.', duration: 'Session' },
  { name: '__client_uat', provider: 'Clerk', purpose: 'Syncs sign-in state across tabs.', duration: '1 year' },
  { name: '__clerk_db_jwt', provider: 'Clerk', purpose: 'Authentication token used to secure your session.', duration: 'Session' },
]

const analyticsCookies: CookieRow[] = [
  { name: 'ph_*', provider: 'PostHog', purpose: 'Pseudonymous product analytics (feature usage, page views). Only set after you accept analytics cookies.', duration: 'Up to 1 year' },
  { name: '_vercel_*', provider: 'Vercel Analytics', purpose: 'Aggregate, privacy-friendly page-view analytics. Only set after you accept analytics cookies.', duration: 'Up to 1 year' },
]

function CookieTable({ rows }: { rows: CookieRow[] }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="text-[#FFFFFF]/60">
            <th className="pb-2 pr-4 font-medium">Name</th>
            <th className="pb-2 pr-4 font-medium">Provider</th>
            <th className="pb-2 pr-4 font-medium">Purpose</th>
            <th className="pb-2 font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-t border-white/10">
              <td className="py-2 pr-4 font-mono text-xs text-[#FFFFFF]/90">{row.name}</td>
              <td className="py-2 pr-4 text-[#FFFFFF]/80">{row.provider}</td>
              <td className="py-2 pr-4 text-[#FFFFFF]/80">{row.purpose}</td>
              <td className="py-2 text-[#FFFFFF]/80">{row.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <header className="mb-8 rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
          <h1 className="text-3xl font-bold text-white">Cookie Policy</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">Last updated: {lastUpdated}</p>
          <p className="mt-4 text-[#FFFFFF]/82">
            This page lists every cookie Joben sets, why, and how long it lasts. You can change your choice at any
            time by clearing your browser&apos;s local storage for this site, or by using the cookie banner shown on
            your first visit.
          </p>
        </header>

        <article className="space-y-4">
          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Strictly Necessary</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              These cookies are required for the site to function — primarily keeping you signed in. They cannot be
              disabled and are not subject to consent under GDPR/ePrivacy.
            </p>
            <CookieTable rows={necessaryCookies} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Analytics (Optional)</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              These cookies help us understand how the product is used so we can improve it. They are only set after
              you click &quot;Accept all&quot; in the cookie banner, and never before.
            </p>
            <CookieTable rows={analyticsCookies} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
            <h2 className="text-lg font-semibold text-white">Marketing</h2>
            <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">
              We do not use marketing or advertising cookies.
            </p>
          </section>
        </article>

        <p className="mt-8 text-sm text-[#FFFFFF]/60">
          Read our <Link href="/privacy" className="text-[#16DB65] hover:text-[#0A9548]">Privacy Policy</Link> for
          how we handle personal data more broadly.
        </p>
      </main>
    </div>
  )
}
