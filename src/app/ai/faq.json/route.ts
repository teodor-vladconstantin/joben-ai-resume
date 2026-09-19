import { siteConfig } from '@/lib/content'
import messagesRo from '../../../../messages/ro.json'

// Structured FAQ for AI search visibility (companion to the FAQPage JSON-LD
// already rendered on the homepage). Static — no request-time data. Not
// locale-routed: sourced from the default (ro) locale's content.
export const dynamic = 'force-static'

export function GET() {
  const body = {
    name: siteConfig.name,
    url: siteConfig.url,
    questions: messagesRo.Faq.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  }

  return Response.json(body)
}
