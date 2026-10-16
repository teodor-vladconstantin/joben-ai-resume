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
    contentHubs: {
      ro: [
        `${siteConfig.url}/ro/ghiduri`,
        `${siteConfig.url}/ro/glosar`,
        `${siteConfig.url}/ro/comparatii`,
      ],
      en: [
        `${siteConfig.url}/en/guides`,
        `${siteConfig.url}/en/glossary`,
        `${siteConfig.url}/en/compare`,
      ],
    },
    fullContent: `${siteConfig.url}/llms-full.txt`,
    fullContentEn: `${siteConfig.url}/llms-full-en.txt`,
  }

  return Response.json(body)
}
