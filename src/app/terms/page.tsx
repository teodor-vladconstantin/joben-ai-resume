import Link from 'next/link'
import { Navbar } from '@/components/ui/Navbar'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms and Conditions | Joben AI Resume Builder',
  description: 'Read the terms and conditions for using Joben. Understand the rules, guidelines, and agreements for using our free AI resume builder and ATS optimization tools.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms and Conditions | Joben AI Resume Builder',
    description: 'Read the terms and conditions for using Joben. Understand the rules, guidelines, and agreements for using our free AI resume builder and ATS optimization tools.',
    url: '/terms',
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
    title: 'Terms and Conditions | Joben AI Resume Builder',
    description: 'Read the terms and conditions for using Joben. Understand the rules, guidelines, and agreements for using our free AI resume builder and ATS optimization tools.',
    images: ['/og-image.png'],
  },
}

const lastUpdated = 'July 12, 2026'

const sections = [
  {
    title: '1. Acceptance of These Terms',
    content:
      'By accessing or using Joben, you agree to these Terms and Conditions. If you do not agree, do not use the service.',
  },
  {
    title: '2. Eligibility and Accounts',
    content:
      'You must be at least 16 years old to use Joben. You must provide accurate account information and keep your login credentials secure. You are responsible for activity under your account.',
  },
  {
    title: '3. Description of Services',
    content:
      'Joben provides resume and cover letter tools, AI-powered analysis, and export features. Features and limits may depend on your plan.',
  },
  {
    title: '4. No Guarantee of Employment Outcomes',
    content:
      'Joben is a resume-writing and optimization tool. We do not guarantee interviews, job offers, or any specific employment outcome. AI-generated scores and suggestions are informational aids, not a promise of results.',
  },
  {
    title: '5. Billing, Upgrades, and Refunds',
    content:
      'Paid plans are billed according to the pricing shown at checkout. Taxes may apply. Unless required by law, fees are non-refundable.',
  },
  {
    title: '6. Acceptable Use',
    content:
      'You agree not to use Joben for unlawful, abusive, or fraudulent activity, and not to attempt unauthorized access, disruption, or misuse of the platform.',
  },
  {
    title: '7. AI Output Disclaimer',
    content:
      'AI-generated suggestions are produced by processing your resume and job-description text through a third-party AI provider (Anthropic). Outputs are provided for informational purposes only. You are responsible for reviewing, editing, and validating all generated content before use, including for accuracy.',
  },
  {
    title: '8. Your Content',
    content:
      'You retain ownership of content you upload or create. You grant us a limited license to process that content — including sending it to our AI provider — only to provide, maintain, and improve the service.',
  },
  {
    title: '9. Intellectual Property',
    content:
      'The Joben platform, branding, software, and related materials are protected by intellectual property laws and remain the property of Joben and its licensors.',
  },
  {
    title: '10. Suspension and Termination',
    content:
      'We may suspend or terminate access for violations of these terms, security risks, non-payment, or legal requirements. You may delete your account at any time from Settings.',
  },
  {
    title: '11. Disclaimers and Limitation of Liability',
    content:
      'The service is provided on an "as is" and "as available" basis. To the maximum extent permitted by law, Joben is not liable for indirect, incidental, or consequential damages, including loss of employment opportunity.',
  },
  {
    title: '12. Governing Law',
    content:
      'These terms are governed by the laws of the European Union and the jurisdiction in which Joben is established, without regard to conflict-of-law principles, without prejudice to any mandatory consumer-protection rights you have under the law of your country of residence.',
  },
  {
    title: '13. Changes to Terms',
    content:
      'We may update these terms from time to time. Continued use after updates means you accept the revised terms.',
  },
  {
    title: '14. Contact',
    content:
      'For legal or privacy-related questions, contact us at privacy@joben.eu.',
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Navbar />

      <main className="grow pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
        <header className="mb-8 rounded-2xl border border-white/10 bg-[#0A0F0D] p-6">
          <h1 className="text-3xl font-bold text-white">Terms and Conditions</h1>
          <p className="mt-2 text-sm text-[#FFFFFF]/72">Last updated: {lastUpdated}</p>
          <p className="mt-4 text-[#FFFFFF]/82">
            Please read these terms carefully before using Joben.
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
          Read our <Link href="/privacy" className="text-[#16DB65] hover:text-[#0A9548]">Privacy Policy</Link> for details on how we collect and process data.
        </p>
      </main>
    </div>
  )
}
