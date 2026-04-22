import { Navbar } from '@/components/ui/Navbar'
import Link from 'next/link'
import { CheckCircle2, ChevronRight, FileText, ShieldCheck, X, Zap } from 'lucide-react'
import { heroContent, statCards, atsPreviewContent, pricingPlans, faqItems, footerContent } from '@/lib/content'
import { AuthAwareSignupLink } from '@/components/ui/AuthAwareSignupLink'

const icons: { [key: string]: React.ElementType } = {
  Zap,
  ShieldCheck,
  FileText,
  CheckCircle2,
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" suppressHydrationWarning>
      <Navbar />

      <main className="grow pt-24 pb-16" suppressHydrationWarning>
        {/* HERO SECTION */}
        <section id="builder" className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center mt-12 mb-20" suppressHydrationWarning>
          <div className="absolute inset-0 -z-10 flex items-center justify-center" suppressHydrationWarning>
            <div className="w-150 h-150 bg-[#0A9548]/6 rounded-full blur-[100px] pointer-events-none" suppressHydrationWarning></div>
            <div className="w-100 h-100 bg-[#16DB65]/8 rounded-full blur-[100px] pointer-events-none -ml-32" suppressHydrationWarning></div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white max-w-4xl mx-auto leading-tight"
              dangerouslySetInnerHTML={{ __html: heroContent.heading.replace("AI Resume Builder", `<span class="text-transparent bg-clip-text bg-linear-to-r from-[#0A9548] to-[#04471C] underline decoration-[#0A9548]/35 underline-offset-8">AI Resume Builder</span>`) }}
          />
          
          <p className="text-xl text-white/72 mb-10 max-w-2xl mx-auto">
            {heroContent.subheading}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12" suppressHydrationWarning>
            <AuthAwareSignupLink className="bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-8 py-4 rounded-xl text-lg font-bold hover:opacity-90 transition-opacity w-full sm:w-auto shadow-lg shadow-[#0A9548]/30 flex items-center justify-center gap-2">
              {heroContent.cta} <ChevronRight className="w-5 h-5" />
            </AuthAwareSignupLink>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm text-white/72" suppressHydrationWarning>
            {heroContent.features.map((feature, index) => {
              const Icon = icons[feature.icon];
              return (
                <span key={index} className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4 text-[#0A9548]" /> {feature.text}
                </span>
              );
            })}
          </div>

          {/* STAT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 text-left" suppressHydrationWarning>
            {statCards.map((card, index) => {
              const Icon = icons[card.icon];
              return (
                <div key={index} className="bg-[#0A0F0D] p-6 rounded-2xl border border-white/10" suppressHydrationWarning>
                  <div className="w-12 h-12 bg-[#0A9548]/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="text-[#0A9548] w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-white/72">{card.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ATS PREVIEW SECTION */}
        <section id="analysis" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-white/10" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{atsPreviewContent.heading}</h2>
            <p className="text-white/72 max-w-2xl mx-auto">{atsPreviewContent.subheading}</p>
          </div>
          
          <div className="relative overflow-hidden bg-[#0A0F0D] rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl" suppressHydrationWarning>
            <div className="pointer-events-none absolute -left-16 top-1/2 h-48 w-48 -translate-y-1/2 rounded-full bg-[#0A9548]/14 blur-3xl" suppressHydrationWarning></div>

            <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-[1.2fr_1fr]" suppressHydrationWarning>
              <div className="relative" suppressHydrationWarning>
                <div className="absolute -right-3 -top-3 sm:-right-4 sm:-top-4" suppressHydrationWarning>
                  <div className="rounded-full border border-[#16DB65]/40 bg-[#020202]/95 p-2 shadow-[0_0_28px_rgba(10,149,72,0.35)]" suppressHydrationWarning>
                    <div
                      className="relative grid h-20 w-20 place-items-center rounded-full"
                      style={{
                        background: `conic-gradient(#16DB65 ${atsPreviewContent.score}%, rgba(255,255,255,0.08) ${atsPreviewContent.score}% 100%)`,
                      }}
                      suppressHydrationWarning
                    >
                      <div className="absolute inset-1.75 rounded-full bg-[#020202]" suppressHydrationWarning></div>
                      <div className="relative text-center" suppressHydrationWarning>
                        <p className="text-2xl leading-none font-black text-white">{atsPreviewContent.score}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-wider text-[#16DB65]">Result</p>
                      </div>
                    </div>
                  </div>
                </div>

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
                            <li>Led migration to event-driven services, reducing checkout failures by 32%.</li>
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
                            <li>Implemented resilience patterns that improved uptime from 99.1% to 99.93%.</li>
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

              <div className="space-y-6" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <h3 className="text-[#0A9548] font-bold mb-2">Strengths</h3>
                <ul className="space-y-2">
                  {atsPreviewContent.strengths.map((strength, index) => (
                    <li key={index} className="flex gap-2 items-start"><CheckCircle2 className="w-5 h-5 text-[#0A9548] shrink-0" /><span className="text-white/78">{strength}</span></li>
                  ))}
                </ul>
              </div>
              
              <div suppressHydrationWarning>
                <h3 className="text-[#f59e0b] font-bold mb-2">How to Improve</h3>
                <div className="bg-[#020202] rounded-xl p-4 border border-[#f59e0b]/30" suppressHydrationWarning>
                  <p className="text-sm text-white/78 mb-2">Change: <span className="text-red-400 line-through">{atsPreviewContent.improvement.before}</span></p>
                  <p className="text-sm text-white/78">To: <span className="text-[#0A9548] font-medium">{atsPreviewContent.improvement.after}</span></p>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-white/10" suppressHydrationWarning>
          <div className="text-center mb-16" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-white/72 max-w-2xl mx-auto">Start for free, upgrade when you need the competitive edge.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto" suppressHydrationWarning>
            {pricingPlans.map((plan, index) => (
              <div key={index} className={`
                ${plan.isPrimary ? 'bg-[#0A0F0D] transform md:-translate-y-4 shadow-xl shadow-[#0A9548]/20' : plan.isBestValue ? 'bg-[#0A0F0D] border-2 border-white/10 shadow-lg shadow-[#0A9548]/25' : 'bg-[#0A0F0D]'}
                p-8 rounded-3xl border border-white/10 flex flex-col relative
              `} suppressHydrationWarning>
                {plan.isBestValue && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[#0A9548] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide" suppressHydrationWarning>
                    Best Value (Save 33%)
                  </div>
                )}

                <h3 className={`text-xl font-bold text-white ${plan.isPrimary ? 'text-transparent bg-clip-text bg-linear-to-r from-[#0A9548] to-[#04471C]' : ''}`}>{plan.name}</h3>
                <p className="text-white/72 text-sm mt-2 mb-6">{plan.description}</p>
                <div className="text-4xl font-bold text-white mb-6" suppressHydrationWarning>{plan.price}<span className="text-lg text-white/50 font-normal">{plan.price_period}</span></div>
                <ul className="space-y-4 mb-8 grow">
                  {plan.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex gap-3 text-white/78"><CheckCircle2 className="text-[#0A9548] w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                  {plan.excludedFeatures.map((feature, fIndex) => (
                    <li key={`excluded-${fIndex}`} className="flex gap-3 text-white/42 line-through"><X className="text-red-400 w-5 h-5 shrink-0 mt-0.5" /> {feature}</li>
                  ))}
                </ul>
                <AuthAwareSignupLink className={`w-full py-3 rounded-xl text-center font-medium text-white transition-colors ${
                  plan.isBestValue ? 'bg-linear-to-r from-[#0A9548] to-[#04471C] hover:opacity-90' : 
                  plan.isPrimary ? 'bg-[#0A9548] hover:bg-[#16DB65]' : 
                  'border border-white/10 hover:bg-white/10'
                }`}>{plan.cta}</AuthAwareSignupLink>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-20 border-t border-white/10" suppressHydrationWarning>
          <div className="text-center mb-12" suppressHydrationWarning>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-white/72 max-w-2xl mx-auto">Everything you need to know before building your next resume.</p>
          </div>

          <div className="mx-auto max-w-4xl space-y-4" suppressHydrationWarning>
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-[#0A0F0D]"
                suppressHydrationWarning
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-lg font-semibold text-white [&::-webkit-details-marker]:hidden"
                  suppressHydrationWarning
                >
                  <span>{item.question}</span>
                  <span className="text-2xl leading-none text-[#0A9548] transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <div className="px-6 pb-5 text-white/72" suppressHydrationWarning>{item.answer}</div>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-[#020202] py-12 border-t border-white/10 text-center" suppressHydrationWarning>
        <div className="max-w-4xl mx-auto px-4" suppressHydrationWarning>
          <h2 className="text-2xl font-bold text-white mb-4">{footerContent.heading}</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8" suppressHydrationWarning>
            <AuthAwareSignupLink className="bg-linear-to-r from-[#0A9548] to-[#04471C] text-white px-6 py-3 rounded-xl font-medium hover:opacity-90">{footerContent.ctaPrimary}</AuthAwareSignupLink>
            <Link href="/dashboard" className="bg-[#0A0F0D] border border-white/10 text-white px-6 py-3 rounded-xl font-medium hover:bg-white/10">{footerContent.ctaSecondary}</Link>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[#FFFFFF]/72" suppressHydrationWarning>
            <Link href="/terms" className="hover:text-[#16DB65]">Terms & Conditions</Link>
            <Link href="/privacy" className="hover:text-[#16DB65]">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}


