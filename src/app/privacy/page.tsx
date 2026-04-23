import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Joben AI Resume Builder',
  description: 'Read the privacy policy for Joben. Learn how our free AI resume builder securely handles, protects, and processes your personal information and resume data.',
  alternates: {
    canonical: '/privacy',
  },
}

const lastUpdated = 'April 20, 2026'

const sections = [
  {
    title: '1. Scope',
    content:
      'This Privacy Policy explains how Joben collects, uses, stores, and shares your personal data when you use our website and services.',
  },
  {
    title: '2. Data We Collect',
    content:
      'We may collect account details (such as name and email), profile and resume content, billing metadata, usage analytics, and technical logs needed to operate and secure the service.',
  },
  {
    title: '3. How We Use Data',
    content:
      'We use data to provide core features, process payments, improve performance, prevent abuse, send service communications, and deliver customer support.',
  },
  {
    title: '4. AI Processing',
    content:
      'When you request AI features, relevant input data may be sent to our AI providers to generate outputs. We send only what is necessary for the requested functionality.',
  },
  {
    title: '5. Service Providers',
    content:
      'We use third-party providers for infrastructure and functionality, such as authentication, database hosting, payments, email, caching, analytics, and AI inference. These providers process data under their own terms and data processing commitments.',
  },
  {
    title: '6. Legal Bases (Where Applicable)',
    content:
      'We process data based on contract performance, legitimate interests, legal obligations, and your consent where required by applicable law.',
  },
  {
    title: '7. Data Retention',
    content:
      'We retain personal data only as long as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements.',
  },
  {
    title: '8. Security',
    content:
      'We implement reasonable technical and organizational safeguards. No method of transmission or storage is completely secure, so absolute security cannot be guaranteed.',
  },
  {
    title: '9. Your Rights',
    content:
      'Depending on your location, you may have rights to access, correct, delete, or export your data, and to object to or restrict certain processing activities.',
  },
  {
    title: '10. Cookies and Similar Technologies',
    content:
      'We may use cookies and similar technologies to keep sessions active, improve reliability, and understand product usage.',
  },
  {
    title: '11. International Transfers',
    content:
      'Your information may be processed in countries outside your jurisdiction. Where required, we rely on appropriate safeguards for cross-border data transfers.',
  },
  {
    title: '12. Changes to This Policy',
    content:
      'We may update this policy periodically. Continued use after an update means you acknowledge the revised version.',
  },
  {
    title: '13. Contact',
    content:
      'For privacy requests or questions, contact us at admin@joben.eu.',
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
