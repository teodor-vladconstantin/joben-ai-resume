import { siteConfig } from '@/lib/content'
import messagesRo from '../../../../messages/ro.json'

// Structured site summary for AI engines that prefer JSON over markdown
// (companion to /llms.txt). Static — no request-time data. Not
// locale-routed: sourced from the default (ro) locale's content.
export const dynamic = 'force-static'

export function GET() {
  const body = {
    name: siteConfig.name,
    url: siteConfig.url,
    description: messagesRo.Metadata.home.description,
    category: 'AI resume and cover letter builder',
    languages: ['ro', 'en'],
    primaryMarket: 'Romania',
    keyPages: [
      { url: `${siteConfig.url}/ro`, description: 'Home: AI resume and cover letter builder with ATS-optimized templates.' },
      { url: `${siteConfig.url}/ro/pricing`, description: 'Free, Pro, and Recruiting plans.' },
      { url: `${siteConfig.url}/ro/free-ats-checker`, description: 'Free 0-100 ATS score with a category breakdown, no signup required.' },
      { url: `${siteConfig.url}/ro/resume-examples`, description: 'Role-specific ATS keywords and resume writing guidance.' },
    ],
    fullContent: `${siteConfig.url}/llms-full.txt`,
  }

  return Response.json(body)
}
