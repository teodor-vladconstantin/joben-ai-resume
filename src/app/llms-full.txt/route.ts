import { siteConfig } from '@/lib/content'
import { resumeRoles } from '@/data/resume-roles'
import messagesRo from '../../../messages/ro.json'

// Full-content companion to /llms.txt: the same facts already rendered on
// /pricing, the homepage FAQ, and the resume-examples pages, as plain
// markdown so an LLM crawler doesn't have to parse rendered HTML to cite
// them correctly. Static — no request-time data. Not locale-routed: sourced
// from the default (ro) locale's content.
export const dynamic = 'force-static'

export function GET() {
  const pricingSection = messagesRo.Pricing.plans
    .map(
      (plan) =>
        `### ${plan.name} — ${plan.price}${plan.pricePeriod}\n\n${plan.description}\n\n${plan.features
          .map((feature) => `- ${feature}`)
          .join('\n')}`
    )
    .join('\n\n')

  const faqSection = messagesRo.Faq.map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n')

  const roleSections = resumeRoles
    .map(
      (role) =>
        `### ${role.title.ro}\n\nKeywords: ${role.keywords.ro.join(', ')}\n\nCommon mistakes:\n${role.commonMistakes.ro
          .map((mistake) => `- ${mistake}`)
          .join('\n')}\n\nWeak bullet: "${role.weakBullet.ro}"\n\nStrong bullet: "${role.strongBullet.ro}"`
    )
    .join('\n\n')

  const body = `# ${siteConfig.name}

> ${messagesRo.Metadata.home.description}

## Pricing

${pricingSection}

## Frequently Asked Questions

${faqSection}

## Resume Examples by Role

${roleSections}
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
