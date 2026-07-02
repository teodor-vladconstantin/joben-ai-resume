import { Navbar } from '@/components/ui/Navbar'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, FileText, ShieldCheck, X, Zap } from 'lucide-react'
import { heroContent, statCards, atsPreviewContent, pricingPlans, faqItems, footerContent, productLoopSteps } from '@/lib/content'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { HeroWordRotate } from '@/components/landing/HeroWordRotate'
import { AmbientDataTexture } from '@/components/landing/AmbientDataTexture'
import { buttonVariants } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ResumeScoreCard } from '@/components/landing/ResumeScoreCard'
import { ResumeFindingsCard } from '@/components/landing/ResumeFindingsCard'
import { StepSection } from '@/components/landing/StepSection'
import { ScoreStepVisual } from '@/components/landing/steps/ScoreStepVisual'
import { TailorStepVisual } from '@/components/landing/steps/TailorStepVisual'
import { RewriteStepVisual } from '@/components/landing/steps/RewriteStepVisual'
import { CoverLetterStepVisual } from '@/components/landing/steps/CoverLetterStepVisual'
import { ExportStepVisual } from '@/components/landing/steps/ExportStepVisual'

const icons: { [key: string]: React.ElementType } = {
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
};

export default function Home() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://joben.eu/'
          }
        ]
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Joben',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      },
    ],
  };

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="grow pt-24 pb-16" suppressHydrationWarning>
        {/* HERO SECTION */}
        <section id="builder" className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center mt-12 mb-20" suppressHydrationWarning>
          <div className="absolute inset-0 -z-10 flex items-center justify-center" suppressHydrationWarning>
            <div className="w-150 h-150 bg-(--accent)/6 rounded-full blur-[100px] pointer-events-none" suppressHydrationWarning></div>
            <div className="w-100 h-100 bg-(--accent-strong)/8 rounded-full blur-[100px] pointer-events-none -ml-32" suppressHydrationWarning></div>
          </div>
          <AmbientDataTexture />

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-(--foreground) max-w-4xl mx-auto leading-tight">
            {heroContent.heading.prefix}
            <HeroWordRotate words={heroContent.heading.rotatingWords} />
            {heroContent.heading.suffix}
          </h1>

          <p className="text-xl text-(--muted) mb-10 max-w-2xl mx-auto">
            {heroContent.subheading}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12" suppressHydrationWarning>
            <AuthAwareSignupLink className={`${buttonVariants('primary', 'lg')} shadow-lg shadow-(--accent)/30`}>
              {heroContent.cta} <ChevronRight className="w-5 h-5" />
            </AuthAwareSignupLink>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-(--muted)" suppressHydrationWarning>
            {heroContent.features.map((feature, index) => {
              const Icon = icons[feature.icon];
              return (
                <span key={index} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-(--accent)" /> {feature.text}
                </span>
              );
            })}
          </div>

          {/* STAT CARDS */}
          <h2 className="sr-only">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left" suppressHydrationWarning>
            {statCards.map((card, index) => {
              const Icon = icons[card.icon];
              return (
                <Card key={index} className="p-6">
                  <div className="w-12 h-12 bg-(--accent-muted) rounded-xl flex items-center justify-center mb-4">
                    <Icon className="text-(--accent) w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-(--foreground) mb-2">{card.title}</h3>
                  <p className="text-(--muted)">{card.description}</p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ATS PREVIEW SECTION */}
        <section id="analysis" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">{atsPreviewContent.heading}</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">{atsPreviewContent.subheading}</p>
          </div>

          <div className="relative flex flex-col items-center gap-6 lg:block lg:py-8" suppressHydrationWarning>
            <div className="w-full max-w-md lg:mx-auto" suppressHydrationWarning>
              <div className="rounded-2xl border border-white/10 bg-[#020202] p-3 sm:p-4" suppressHydrationWarning>
                <div className="mx-auto rounded-md border border-black/20 bg-white px-4 py-3 font-serif text-[#1F2937] shadow-[0_10px_28px_rgba(0,0,0,0.28)]" suppressHydrationWarning>
                  <div className="border-b border-gray-300 pb-1.5 text-center" suppressHydrationWarning>
                    <p className="text-base font-semibold uppercase tracking-wide text-[#111827]">John Doe</p>
                    <p className="mt-0.5 text-[10px] text-gray-700">(+1) 555 120 9087 • john.doe@email.com • linkedin.com/in/john-doe</p>
                  </div>

                  <div className="mt-2 space-y-2.5 text-[10.5px] leading-relaxed" suppressHydrationWarning>
                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Professional Summary</h4>
                      <p className="mt-1 text-[#374151]">
                        Product-minded software engineer focused on backend reliability, distributed systems, and measurable business impact.
                      </p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Work Experience</h4>

                      <div className="mt-1" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">Senior Software Engineer, Atlas Commerce</p>
                          <p className="shrink-0 text-gray-600">2023 - Present</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>Led migration to event-driven services, reducing checkout failures.</li>
                          <li>Optimized PostgreSQL queries and caching, improving API latency from 410ms to 240ms.</li>
                        </ul>
                      </div>

                      <div className="mt-1.5" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">Backend Engineer, Cloudline Systems</p>
                          <p className="shrink-0 text-gray-600">2021 - 2023</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>Built internal observability tooling adopted by 8 product teams.</li>
                          <li>Implemented resilience patterns that improved uptime and reliability.</li>
                        </ul>
                      </div>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Education</h4>
                      <p className="mt-1 text-[#374151]">B.Sc. in Computer Science, University of Bucharest</p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">Technical Skills</h4>
                      <p className="mt-1 text-[#374151]">TypeScript, Node.js, Java, PostgreSQL, Redis, Docker, AWS, Kubernetes</p>
                    </section>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:absolute lg:top-8 lg:-left-4 xl:-left-12">
              <ResumeFindingsCard strengths={atsPreviewContent.findings.strengths} improvements={atsPreviewContent.findings.improvements} />
            </div>

            <div className="lg:absolute lg:top-24 lg:-right-4 xl:-right-12">
              <ResumeScoreCard score={atsPreviewContent.score} scoreLabel={atsPreviewContent.scoreLabel} categories={atsPreviewContent.categories} />
            </div>
          </div>
        </section>

        {/* PRODUCT LOOP */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto" suppressHydrationWarning>
          {productLoopSteps.map((step, index) => {
            const visuals = [
              <ScoreStepVisual key="score" />,
              <TailorStepVisual key="tailor" />,
              <RewriteStepVisual key="rewrite" />,
              <CoverLetterStepVisual key="cover-letter" />,
              <ExportStepVisual key="export" />,
            ]
            return (
              <StepSection
                key={step.number}
                number={step.number}
                totalSteps={productLoopSteps.length}
                category={step.category}
                heading={step.heading}
                description={step.description}
                bullets={step.bullets}
                visual={visuals[index]}
              />
            )
          })}
        </section>

        {/* PRICING */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-16" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">Simple, Transparent Pricing</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">Start for free, upgrade when you need the competitive edge.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto" suppressHydrationWarning>
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                elevated={plan.isBestValue}
                radius="lg"
                className={`p-8 flex flex-col relative ${plan.isBestValue ? 'border-(--accent)' : ''} ${plan.isPrimary ? 'md:-translate-y-4' : ''}`}
                suppressHydrationWarning
              >
                {plan.isBestValue && (
                  <Badge className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    Best Value
                  </Badge>
                )}

                <h3 className="text-xl font-bold text-(--foreground)">{plan.name}</h3>
                <p className="text-(--muted) text-sm mt-2 mb-6">{plan.description}</p>
                <div className="text-4xl font-bold text-(--foreground) mb-6" suppressHydrationWarning>{plan.price}<span className="text-lg text-(--muted) font-normal">{plan.price_period}</span></div>
                <ul className="space-y-4 mb-8 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex gap-3 text-(--foreground)"><CheckCircle2 className="text-(--accent) w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex gap-3 text-(--muted) line-through"><X className="text-red-400 w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                </ul>
                <AuthAwareSignupLink className={`w-full text-center ${buttonVariants(plan.isBestValue || plan.isPrimary ? 'primary' : 'secondary', 'md')}`}>{plan.cta}</AuthAwareSignupLink>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-(--border)" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">Frequently Asked Questions</h2>
            <p className="text-(--muted) max-w-2xl mx-auto">Everything you need to know before building your next resume.</p>
          </div>

          <div className="mx-auto max-w-4xl" suppressHydrationWarning>
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group border-b border-(--border) first:border-t"
                suppressHydrationWarning
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-lg font-semibold text-(--foreground) [&::-webkit-details-marker]:hidden"
                  suppressHydrationWarning
                >
                  <span>{item.question}</span>
                  <span className="font-mono text-xs uppercase tracking-wide text-(--accent) group-open:hidden">Open</span>
                  <span className="hidden font-mono text-xs uppercase tracking-wide text-(--accent) group-open:inline">Close</span>
                </summary>
                <div className="pb-5 text-(--muted)" suppressHydrationWarning>{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-(--background) py-12 border-t border-(--border) text-center" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4" suppressHydrationWarning>
          <h2 className="text-2xl font-bold text-(--foreground) mb-4">{footerContent.heading}</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8" suppressHydrationWarning>
            <AuthAwareSignupLink className={buttonVariants('primary', 'md')}>{footerContent.ctaPrimary}</AuthAwareSignupLink>
            <Link href="/dashboard" className={buttonVariants('secondary', 'md')}>{footerContent.ctaSecondary}</Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-(--muted)" suppressHydrationWarning>
            <Link href="/terms" className="hover:text-(--accent)">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-(--accent)">Privacy Policy</Link>
          </div>
          <p className="mt-8 text-xs text-(--muted)" suppressHydrationWarning>{footerContent.creatorCredit}</p>
        </div>
      </footer>
    </div>
  )
}


