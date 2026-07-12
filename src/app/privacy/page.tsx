import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Joben AI Resume Builder',
  description: 'Read the privacy policy for Joben. Learn how our free AI resume builder securely handles, protects, and processes your personal information and resume data.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Joben AI Resume Builder',
    description: 'Read the privacy policy for Joben. Learn how our free AI resume builder securely handles, protects, and processes your personal information and resume data.',
    url: '/privacy',
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
    title: 'Privacy Policy | Joben AI Resume Builder',
    description: 'Read the privacy policy for Joben. Learn how our free AI resume builder securely handles, protects, and processes your personal information and resume data.',
    images: ['/og-image.png'],
  },
}

const lastUpdated = 'July 12, 2026'

const sections = [
  {
    title: '1. Scope',
    content:
      'This Privacy Policy explains how Joben ("we", "us") collects, uses, stores, and shares your personal data when you use joben.eu and our AI resume-building services, in accordance with the EU General Data Protection Regulation (GDPR).',
  },
  {
    title: '2. Data We Collect',
    content:
      'Account data: email address and first/last name, collected via Clerk when you sign up. Resume and cover letter content: the full text and structured data you enter into the builder (work history, education, skills). AI analysis results: scores and feedback generated when you run an AI review. Billing metadata: your Stripe customer ID and subscription ID (we never see or store your card number — Stripe handles that directly). Usage analytics: pseudonymous product-usage events (e.g. feature used, plan tier) tied to your account ID, collected only after you accept analytics cookies. Technical/error logs: request identifiers, error messages, and, when an unhandled error occurs, your IP address (via our error-monitoring provider). Feedback: if you submit our in-app feedback form, your email address and free-text responses.',
  },
  {
    title: '3. How We Use Data',
    content:
      'To provide the core resume-building and AI-review service you signed up for; to process payments; to detect and prevent abuse (rate limiting); to send service emails (welcome, inactivity reminders, feedback requests); to fix bugs via error monitoring; and, only with your consent, to understand product usage through analytics.',
  },
  {
    title: '4. AI Processing',
    content:
      'When you use an AI feature (resume analysis, tailoring, cover letter generation, bullet rewriting), the relevant resume or job-description text you provide is sent to Anthropic ("Claude"), our AI provider, solely to generate that output. We do not send your name or email to Anthropic — only the document content needed for the specific request. Anthropic does not use API inputs to train its models by default.',
  },
  {
    title: '5. Sub-Processors',
    content:
      'We share data with the following providers, each acting as a data processor under its own data processing agreement: Anthropic (AI processing of resume/CV text, USA), Stripe (payment processing, global/USA), Resend (transactional email delivery, USA), PostHog (product analytics, EU-hosted instance, only with consent), Upstash (rate-limiting cache, USA), Vercel (application hosting, global/USA), Sentry (error monitoring, EU-hosted instance). Our core database (Supabase/Postgres) is self-hosted on our own infrastructure — it is not a third-party sub-processor.',
  },
  {
    title: '6. Legal Bases',
    content:
      'Contract performance: account creation, resume/cover letter storage, AI features, and billing — necessary to provide the service you signed up for. Legitimate interest: fraud/abuse prevention (rate limiting), error monitoring, and service emails directly related to your account. Consent: analytics cookies (PostHog), which only load after you accept them in the cookie banner. Legal obligation: retaining billing records where required by tax law.',
  },
  {
    title: '7. Data Retention',
    content:
      'Account, resume, cover letter, and AI-analysis data: retained while your account is active and deleted immediately when you delete your account. Billing records: retained by Stripe per their own compliance requirements. Feedback submissions: retained for 24 months. Webhook and analytics event logs: retained for up to 12 months for security and debugging, then purged. Error-monitoring logs (Sentry): retained per our provider\'s default 90-day window. Rate-limiting data (Redis): expires automatically within hours to a month depending on the limit window.',
  },
  {
    title: '8. Security',
    content:
      'We use encryption in transit (TLS) for all traffic, restrict database access to server-side service credentials only, and apply row-level security policies on every table holding personal data. No method of transmission or storage is completely secure, so we cannot guarantee absolute security.',
  },
  {
    title: '9. Your Rights',
    content:
      'Under the GDPR you have the right to: access the personal data we hold about you (use "Export My Data" in Settings for an instant JSON export); request deletion of your account and all associated data (use "Delete Account" in Settings, which is processed immediately); rectify inaccurate data (update it directly in the app or contact us); object to or restrict certain processing, such as analytics (use the cookie banner or contact us); and data portability (the export above is provided in a structured, machine-readable JSON format). To exercise any right not available directly in the app, email privacy@joben.eu. You also have the right to lodge a complaint with your local data protection supervisory authority.',
  },
  {
    title: '10. Cookies and Similar Technologies',
    content:
      'We use strictly necessary cookies to keep you signed in and secure the service, and, only if you accept them via our cookie banner, analytics cookies to understand product usage. See our full Cookie Policy for the complete list of cookies, their purpose, and how to change your choice at any time.',
  },
  {
    title: '11. International Data Transfers',
    content:
      'Some of our sub-processors (Anthropic, Stripe, Resend, Upstash, Vercel) are based in or process data in the United States. Where we transfer personal data outside the European Economic Area, we rely on the European Commission\'s Standard Contractual Clauses (SCCs) or an equivalent adequacy safeguard offered by that provider.',
  },
  {
    title: '12. Children\'s Privacy',
    content:
      'Joben is not directed at, and we do not knowingly collect data from, anyone under 16 years old, the minimum age required to use our services under these terms. If you believe a minor has provided us personal data, contact us and we will delete it.',
  },
  {
    title: '13. Changes to This Policy',
    content:
      'We may update this policy periodically. Material changes will be reflected by an updated "Last updated" date above; continued use after an update means you acknowledge the revised version.',
  },
  {
    title: '14. Contact',
    content:
      'For privacy requests or questions, contact us at privacy@joben.eu.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <header className="mb-8 rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
          <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">Last updated: {lastUpdated}</p>
          <p className="mt-4 text-[#FFFFFF]/82">
            This policy describes how we handle your information when you use Joben.
          </p>
        </header>

        <article className="space-y-4">
          {sections.map((section) => (
            <section key={section.title} className="rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
              <h2 className="text-lg font-semibold text-white">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#FFFFFF]/80">{section.content}</p>
            </section>
          ))}
        </article>

        <p className="mt-8 text-sm text-[#FFFFFF]/60">
          Read our <Link href="/terms" className="text-[#16DB65] hover:text-[#0A9548]">Terms and Conditions</Link> for legal terms of service.
        </p>
      </main>
    </div>
  )
}
