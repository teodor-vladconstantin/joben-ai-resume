import { siteConfig } from '@/lib/content'
import messagesRo from '../../../../messages/ro.json'

// Structured service/capability description for AI engines and agents
// (companion to the SoftwareApplication JSON-LD already rendered on the
// homepage). Static — no request-time data. Not locale-routed: sourced from
// the default (ro) locale's content.
export const dynamic = 'force-static'

export function GET() {
  const body = {
    name: siteConfig.name,
    url: siteConfig.url,
    description: messagesRo.Metadata.home.description,
    category: 'BusinessApplication',
    plans: messagesRo.Pricing.plans.map((plan) => ({
      name: plan.name,
      price: plan.price,
      pricePeriod: plan.pricePeriod,
      description: plan.description,
      features: plan.features,
    })),
  }

  return Response.json(body)
}
