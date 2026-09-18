import { siteConfig } from '@/lib/content'
import { resumeRoles } from '@/data/resume-roles'
import messagesRo from '../../../messages/ro.json'

// llmstxt.org-shaped index for AI answer-engine crawlers (Perplexity,
// ChatGPT Search, Claude, Gemini): short and link-based. Full page content
// lives at /llms-full.txt. Static — no request-time data — so it's
// prerendered and served from the CDN like robots.txt/sitemap.xml.
// Not locale-routed (single global file): sourced from the default (ro)
// locale's content, matching the site's primary market.
export const dynamic = 'force-static'

export function GET() {
  const roleLinks = resumeRoles
    .map(
      (role) =>
        `- [${role.title.ro} Resume Examples](${siteConfig.url}/ro/resume-examples/${role.slug.ro}): ATS keywords, common mistakes, and a weak-vs-strong bullet rewrite for ${role.title.ro} resumes.`
    )
    .join('\n')

  const body = `# ${siteConfig.name}

> ${messagesRo.Metadata.home.description}

## Product

- [Home](${siteConfig.url}/ro): AI resume and cover letter builder with ATS-optimized templates.
- [Pricing](${siteConfig.url}/ro/pricing): Free, Pro, and Recruiting plans.
- [Free ATS Resume Checker](${siteConfig.url}/ro/free-ats-checker): Free 0-100 ATS score with a category breakdown, no signup required.
- [Resume Examples](${siteConfig.url}/ro/resume-examples): Role-specific ATS keywords and resume writing guidance.

## Resume Examples by Role

${roleLinks}

## Legal

- [Privacy Policy](${siteConfig.url}/ro/privacy)
- [Terms of Service](${siteConfig.url}/ro/terms)
- [Cookie Policy](${siteConfig.url}/ro/cookies)

## Full content

See ${siteConfig.url}/llms-full.txt for pricing details and FAQ answers in full text.
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
