import { Navbar } from '@/components/ui/Navbar'
import { ArrowRight, Check, FileDown, Gauge, Languages, LayoutTemplate, Mail, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { getMessages, setRequestLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'
import { pricingPlanMeta, siteConfig, BUILD_TIME } from '@/lib/content'
import { atsCheckerPath } from '@/lib/ats-checker-path'
import { AppLink } from '@/components/ui/AppLink'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'
import { PlanCta } from '@/components/pricing/PlanCta'
import { buttonVariants } from '@/components/ui/Button'
import { ResumeScoreCard } from '@/components/landing/ResumeScoreCard'
import { ResumeFindingsCard } from '@/components/landing/ResumeFindingsCard'
import { CtaCard, FaqList, Section, wrap } from '@/components/marketing/section'
import type { Messages } from '@/i18n/messages'
import { JsonLd } from '@/components/seo/JsonLd'

const featureIcons = [Gauge, Sparkles, Target, Mail, LayoutTemplate, FileDown, Languages, ShieldCheck]

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
  }

  const lp = home.landing
  const accent = home.heroRotatingWords[0]

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd data={jsonLd} />
      <Navbar />

      <main className="grow pt-16">
        <section id="builder" data-section="Hero" className="border-b border-border">
          <div className={`${wrap} grid gap-12 py-16 sm:py-24 lg:grid-cols-[1.05fr_1fr] lg:items-center`}>
            <div>
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
                <span className="size-1.5 rounded-full bg-primary" aria-hidden /> {lp.pill}
              </p>
              <h1 className="text-4xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
                <span className="mb-4 block text-sm font-semibold tracking-normal text-muted-foreground sm:text-base">{home.heroKeywords}</span>
                {home.heroPrefix}
                <span className="text-brand">{accent}</span>
                {home.heroSuffix}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">{home.subheading}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <AuthAwareSignupLink ctaId="home_hero" signedOutHref={atsCheckerPath(locale)} className={buttonVariants('primary', 'lg')}>
                  {home.cta} <ArrowRight />
                </AuthAwareSignupLink>
                <a href="#how" className={buttonVariants('outline', 'lg')}>{lp.ctaSecondary}</a>
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-pop sm:p-5">
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
              <ResumeFindingsCard
                label={home.atsPreview.whatWeFoundLabel}
                strengths={{ title: home.atsPreview.strengthsTitle, description: home.atsPreview.strengthsDescription }}
                improvements={{ title: home.atsPreview.improvementsTitle, description: home.atsPreview.improvementsDescription }}
              />
            </div>
          </div>
          <ul className={`${wrap} grid grid-cols-2 gap-x-6 gap-y-3 border-t border-border py-5 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:justify-between`}>
            {lp.trust.map((t) => (
              <li key={t} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" aria-hidden />{t}</li>
            ))}
          </ul>
        </section>

        <Section id="how" eyebrow={lp.how.eyebrow} title={lp.how.title}>
          <ol className="grid gap-6 md:grid-cols-3">
            {lp.how.steps.map((step, i) => (
              <li key={step.title} className="rounded-xl border border-border bg-card p-6">
                <span className="text-3xl font-bold tabular-nums text-brand">0{i + 1}</span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{step.text}</p>
              </li>
            ))}
          </ol>
        </Section>

        <Section id="features" eyebrow={lp.features.eyebrow} title={lp.features.title} className="border-t border-border bg-muted/40">
          <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {lp.features.items.map((f, i) => {
              const Icon = featureIcons[i]
              return (
                <div key={f.title} className="bg-card p-6">
                  <Icon className="size-5 text-brand" aria-hidden />
                  <h3 className="mt-4 text-base font-semibold leading-snug">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
                </div>
              )
            })}
          </div>
        </Section>

        <Section eyebrow={lp.why.eyebrow} title={lp.why.title}>
          <dl className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {lp.why.items.map((d) => (
              <div key={d.title} className="border-t border-border pt-5">
                <dt className="text-lg font-semibold">{d.title}</dt>
                <dd className="mt-2 leading-relaxed text-muted-foreground">{d.text}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section id="pricing" eyebrow={pricing.heading} title={home.pricingTeaserHeading} intro={home.pricingTeaserSubheading} className="border-t border-border bg-muted/40">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {pricing.plans.map((plan, index) => {
              const meta = pricingPlanMeta[index]
              return (
                <div key={plan.name} className={`flex flex-col rounded-xl border bg-card p-6 ${meta.isPrimary ? 'border-primary shadow-card' : 'border-border'}`}>
                  {plan.badge ? <p className="mb-3 text-xs font-semibold text-brand">{plan.badge}</p> : null}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mb-5 mt-2 text-sm text-muted-foreground">{plan.description}</p>
                  <div className="mb-5 text-4xl font-bold tabular-nums">{plan.price}<span className="text-lg font-normal text-muted-foreground">{plan.pricePeriod}</span></div>
                  <ul className="mb-6 grow space-y-3 text-sm">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden /> {feature}</li>
                    ))}
                    {plan.excludedFeatures.map((feature) => (
                      <li key={`x-${feature}`} className="flex gap-2 text-muted-foreground line-through"><X className="mt-0.5 size-4 shrink-0" aria-hidden /> {feature}</li>
                    ))}
                  </ul>
                  <PlanCta label={plan.cta} plan={meta.planId} className={`w-full text-center ${buttonVariants(meta.isPrimary ? 'primary' : 'secondary', 'md')}`} />
                </div>
              )
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{pricing.vatNote}</p>
          <AppLink href="/pricing" className={`mt-4 ${buttonVariants('link', 'default', 'px-0')}`}>{lp.pricingMore} <ArrowRight /></AppLink>
        </Section>

        <Section id="faq" eyebrow={home.faqHeading} title={home.faqSubheading}>
          <div className="max-w-3xl">
            <FaqList items={faq.map((item) => ({ q: item.question, a: item.answer }))} />
          </div>
        </Section>

        <CtaCard title={lp.cta.title} text={lp.cta.text}>
          <AuthAwareSignupLink ctaId="home_footer" className={buttonVariants('primary', 'lg')}>
            {footer.ctaPrimary} <ArrowRight />
          </AuthAwareSignupLink>
          <AppLink href="/dashboard" className={buttonVariants('outline', 'lg')}>{footer.ctaSecondary}</AppLink>
        </CtaCard>
      </main>
    </div>
  )
}
