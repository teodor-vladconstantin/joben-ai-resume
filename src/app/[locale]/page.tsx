import { Navbar } from '@/components/ui/Navbar'
import { Link } from '@/i18n/navigation'
import { ArrowRight, CheckCircle2, ChevronRight, FileText, ShieldCheck, X, Zap } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'
import { pricingPlanMeta, siteConfig, BUILD_TIME } from '@/lib/content'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { PlanCta } from '@/components/pricing/PlanCta'
import { HeroWordRotate } from '@/components/landing/HeroWordRotate'
import { AmbientDataTexture } from '@/components/landing/AmbientDataTexture'
import { buttonVariants } from '@/components/ui/Button'
import { ResumeScoreCard } from '@/components/landing/ResumeScoreCard'
import { ResumeFindingsCard } from '@/components/landing/ResumeFindingsCard'
import { StepSection } from '@/components/landing/StepSection'
import { ScoreStepVisual } from '@/components/landing/steps/ScoreStepVisual'
import { TailorStepVisual } from '@/components/landing/steps/TailorStepVisual'
import { RewriteStepVisual } from '@/components/landing/steps/RewriteStepVisual'
import { CoverLetterStepVisual } from '@/components/landing/steps/CoverLetterStepVisual'
import { ExportStepVisual } from '@/components/landing/steps/ExportStepVisual'
import { RevealWords } from '@/components/motion/RevealWords'
import { RevealRule } from '@/components/motion/RevealRule'
import { Reveal } from '@/components/motion/Reveal'
import type { Messages } from '@/i18n/messages'

const icons: { [key: string]: React.ElementType } = {
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
};

const featureIconOrder = ['CheckCircle2', 'CheckCircle2', 'CheckCircle2']
const statCardIconOrder = ['Zap', 'ShieldCheck', 'FileText']

export default async function Home({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = (await getMessages({ locale })) as unknown as Messages
  const { Common, Home: home, Pricing: pricing, Faq: faq, Footer: footer } = messages

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: Common.home,
            item: `${siteConfig.url}/${locale}`,
          },
        ],
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Joben',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        dateModified: BUILD_TIME,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'RON',
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((item) => ({
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

  const mock = home.atsPreview.mockResume

  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="grow pt-24 pb-16" suppressHydrationWarning>
        {/* HERO SECTION */}
        <section id="builder" data-section="Hero" className="relative px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto mt-12 mb-20" suppressHydrationWarning>
          <AmbientDataTexture />

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-(--foreground) max-w-3xl leading-tight">
            <RevealWords as="span" text={home.heroPrefix} />{' '}
            <HeroWordRotate words={home.heroRotatingWords} />{' '}
            <RevealWords as="span" text={home.heroSuffix} />
          </h1>

          <p className="text-xl text-(--muted) mb-10 max-w-xl">
            {home.subheading}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4 mb-12" suppressHydrationWarning>
            <AuthAwareSignupLink signedOutHref="/free-ats-checker" className={buttonVariants('primary', 'lg')}>
              {home.cta} <ChevronRight className="w-5 h-5" />
            </AuthAwareSignupLink>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-(--muted)" suppressHydrationWarning>
            {home.features.map((feature, index) => {
              const Icon = icons[featureIconOrder[index]];
              return (
                <span key={index} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-(--muted)" /> {feature}
                </span>
              );
            })}
          </div>

          {/* PLATFORM FEATURES */}
          <h2 className="sr-only">{home.platformFeaturesHeading}</h2>
          <div className="mt-20 grid grid-cols-1 border-t border-(--border) md:grid-cols-3" suppressHydrationWarning>
            {home.statCards.map((card, index) => {
              const Icon = icons[statCardIconOrder[index]];
              return (
                <div key={index} className="border-b border-(--border) py-8 md:border-b-0 md:border-r md:last:border-r-0 md:pr-8 md:[&:not(:first-child)]:pl-8">
                  <Icon className="h-5 w-5 text-(--foreground)" />
                  <h3 className="mt-4 text-lg font-bold text-(--foreground)">{card.title}</h3>
                  <p className="mt-2 text-sm text-(--muted)">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ATS PREVIEW SECTION */}
        <section id="analysis" data-section="Analysis" className="px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto py-20" suppressHydrationWarning>
          <RevealRule className="mb-20" />
          <div className="mb-12 max-w-xl" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">{home.atsPreview.heading}</h2>
            <p className="text-(--muted)">{home.atsPreview.subheading}</p>
          </div>

          <div className="relative flex flex-col items-center gap-6 lg:block lg:py-8" suppressHydrationWarning>
            <Reveal className="w-full max-w-md lg:mx-auto" suppressHydrationWarning>
              <div className="border border-(--border) bg-(--surface) p-3 sm:p-4" suppressHydrationWarning>
                <div className="mx-auto border border-black/10 bg-white px-4 py-3 font-serif text-[#1F2937]" suppressHydrationWarning>
                  <div className="border-b border-gray-300 pb-1.5 text-center" suppressHydrationWarning>
                    <p className="text-base font-semibold uppercase tracking-wide text-[#111827]">{mock.name}</p>
                    <p className="mt-0.5 text-[10px] text-gray-700">{mock.contact}</p>
                  </div>

                  <div className="mt-2 space-y-2.5 text-[10.5px] leading-relaxed" suppressHydrationWarning>
                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">{mock.summaryHeading}</h4>
                      <p className="mt-1 text-[#374151]">{mock.summary}</p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">{mock.experienceHeading}</h4>

                      <div className="mt-1" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">{mock.job1Title}</p>
                          <p className="shrink-0 text-gray-600">{mock.job1Dates}</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>{mock.job1Bullet1}</li>
                          <li>{mock.job1Bullet2}</li>
                        </ul>
                      </div>

                      <div className="mt-1.5" suppressHydrationWarning>
                        <div className="flex justify-between gap-3" suppressHydrationWarning>
                          <p className="font-semibold text-[#111827]">{mock.job2Title}</p>
                          <p className="shrink-0 text-gray-600">{mock.job2Dates}</p>
                        </div>
                        <ul className="mt-0.5 list-disc pl-4 text-[#374151]">
                          <li>{mock.job2Bullet1}</li>
                          <li>{mock.job2Bullet2}</li>
                        </ul>
                      </div>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">{mock.educationHeading}</h4>
                      <p className="mt-1 text-[#374151]">{mock.education}</p>
                    </section>

                    <section suppressHydrationWarning>
                      <h4 className="border-b border-gray-300 text-[11px] font-semibold text-[#111827]">{mock.skillsHeading}</h4>
                      <p className="mt-1 text-[#374151]">{mock.skills}</p>
                    </section>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal className="lg:absolute lg:top-8 lg:-left-4 xl:-left-12" threshold={0.3}>
              <ResumeFindingsCard
                label={home.atsPreview.whatWeFoundLabel}
                strengths={{ title: home.atsPreview.strengthsTitle, description: home.atsPreview.strengthsDescription }}
                improvements={{ title: home.atsPreview.improvementsTitle, description: home.atsPreview.improvementsDescription }}
              />
            </Reveal>

            <Reveal className="lg:absolute lg:top-24 lg:-right-4 xl:-right-12" threshold={0.3}>
              <ResumeScoreCard
                score={93}
                scoreLabel={home.atsPreview.scoreLabel}
                categoryBreakdownLabel={home.atsPreview.categoryBreakdownLabel}
                categories={home.atsPreview.categories.map((label, i) => ({
                  label,
                  value: [23, 32, 9, 24, 5][i],
                  max: [25, 35, 10, 25, 5][i],
                }))}
              />
            </Reveal>
          </div>
        </section>

        {/* PRODUCT LOOP */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto" suppressHydrationWarning>
          {home.productLoop.map((step, index) => {
            const visuals = [
              <ScoreStepVisual key="score" />,
              <TailorStepVisual key="tailor" />,
              <RewriteStepVisual key="rewrite" />,
              <CoverLetterStepVisual key="cover-letter" />,
              <ExportStepVisual key="export" />,
            ]
            return (
              <StepSection
                key={step.category}
                number={String(index + 1).padStart(2, '0')}
                totalSteps={home.productLoop.length}
                category={step.category}
                heading={step.heading}
                description={step.description}
                bullets={step.bullets}
                visual={visuals[index]}
                isFirst={index === 0}
              />
            )
          })}
        </section>

        {/* PRICING */}
        <section id="pricing" data-section="Pricing" className="px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto py-20" suppressHydrationWarning>
          <RevealRule className="mb-20" />
          <div className="mb-16 max-w-xl" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">
              <RevealWords text={home.pricingTeaserHeading} />
            </h2>
            <p className="text-(--muted)">{home.pricingTeaserSubheading}</p>
          </div>

          <div className="grid grid-cols-1 border border-(--border) divide-y divide-(--border) md:grid-cols-3 md:divide-x md:divide-y-0" suppressHydrationWarning>
            {pricing.plans.map((plan, index) => {
              const meta = pricingPlanMeta[index]
              return (
                <div
                  key={index}
                  className={`flex flex-col p-8 ${meta.isBestValue ? 'bg-(--accent-muted)' : ''}`}
                  suppressHydrationWarning
                >
                  {meta.isBestValue && (
                    <p className="mb-4 font-mono text-(length:--text-label) text-(--foreground)">{Common.bestValue}</p>
                  )}

                  <h3 className="text-xl font-bold text-(--foreground)">{plan.name}</h3>
                  <p className="text-(--muted) text-sm mt-2 mb-6">{plan.description}</p>
                  <div className="mb-6 font-mono text-4xl font-bold tabular-nums text-(--foreground)" suppressHydrationWarning>{plan.price}<span className="font-sans text-lg text-(--muted) font-normal">{plan.pricePeriod}</span></div>
                  <ul className="space-y-4 mb-8 grow">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex gap-3 text-(--foreground)"><CheckCircle2 className="text-(--foreground) w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                    ))}
                    {plan.excludedFeatures.map((feature, fIndex) => (
                      <li key={`excluded-${fIndex}`} className="flex gap-3 text-(--muted) line-through"><X className="text-(--muted) w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                    ))}
                  </ul>
                  <PlanCta
                    label={plan.cta}
                    plan={meta.planId}
                    className={`w-full text-center ${buttonVariants(meta.isBestValue || meta.isPrimary ? 'primary' : 'secondary', 'md')}`}
                  />
                </div>
              )
            })}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" data-section="FAQ" className="px-4 sm:px-6 lg:px-8 max-w-(--container-max) mx-auto py-20" suppressHydrationWarning>
          <RevealRule className="mb-20" />
          <div className="mb-12 max-w-xl" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-(--foreground) mb-4">
              <RevealWords text={home.faqHeading} />
            </h2>
            <p className="text-(--muted)">{home.faqSubheading}</p>
          </div>

          <div className="max-w-3xl" suppressHydrationWarning>
            {faq.map((item, index) => (
              <details
                key={index}
                className="group border-b border-(--border) first:border-t"
                suppressHydrationWarning
              >
                <summary
                  className="row-invert flex cursor-pointer list-none items-center justify-between gap-4 px-2 -mx-2 py-5 text-left text-lg font-semibold [&::-webkit-details-marker]:hidden"
                  suppressHydrationWarning
                >
                  <span className="flex items-center gap-3">
                    <ArrowRight className="row-invert-arrow h-4 w-4 shrink-0" />
                    {item.question}
                  </span>
                  <span className="font-mono text-xs group-open:hidden">{home.faqOpen}</span>
                  <span className="hidden font-mono text-xs group-open:inline">{home.faqClose}</span>
                </summary>
                <div className="pb-5 text-(--muted)" suppressHydrationWarning>{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <section className="bg-(--background) py-12 border-t border-(--border)" suppressHydrationWarning>
        <div className="max-w-(--container-max) mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
          <h2 className="text-2xl font-bold text-(--foreground) mb-4">{footer.heading}</h2>
          <div className="flex flex-col sm:flex-row gap-4 mt-8" suppressHydrationWarning>
            <AuthAwareSignupLink className={buttonVariants('primary', 'md')}>{footer.ctaPrimary}</AuthAwareSignupLink>
            <Link href="/dashboard" className={buttonVariants('secondary', 'md')}>{footer.ctaSecondary}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
