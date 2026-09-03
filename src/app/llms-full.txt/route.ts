import { siteConfig, faqItems, pricingPlans } from '@/lib/content'
import { resumeRoles } from '@/data/resume-roles'

// Full-content companion to /llms.txt: the same facts already rendered on
// /pricing, the homepage FAQ, and the resume-examples pages, as plain
// markdown so an LLM crawler doesn't have to parse rendered HTML to cite
// them correctly. Static — no request-time data.
export const dynamic = 'force-static'

export function GET() {
  const pricingSection = pricingPlans
    .map(
      (plan) =>
        `### ${plan.name} — ${plan.price}${plan.price_period}\n\n${plan.description}\n\n${plan.features
          .map((feature) => `- ${feature}`)
          .join('\n')}`
    )
    .join('\n\n')

  const faqSection = faqItems.map((item) => `### ${item.question}\n\n${item.answer}`).join('\n\n')

  const roleSections = resumeRoles
    .map(
      (role) =>
        `### ${role.title}\n\nKeywords: ${role.keywords.join(', ')}\n\nCommon mistakes:\n${role.commonMistakes
          .map((mistake) => `- ${mistake}`)
          .join('\n')}\n\nWeak bullet: "${role.weakBullet}"\n\nStrong bullet: "${role.strongBullet}"`
    )
    .join('\n\n')

  const body = `# ${siteConfig.name}

> ${siteConfig.description}

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
