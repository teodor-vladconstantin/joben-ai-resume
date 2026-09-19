import { siteConfig } from '@/lib/content'

// AI-crawler permissions file (emerging ai.txt convention, companion to
// robots.txt). Static — no request-time data — served from the CDN.
export const dynamic = 'force-static'

export function GET() {
  const body = `# ai.txt for ${siteConfig.name}
# Machine-readable AI content index: ${siteConfig.url}/llms.txt
# Full content for AI answer engines: ${siteConfig.url}/llms-full.txt

User-agent: *
Content-Usage: allow
Training-Usage: allow

Sitemap: ${siteConfig.url}/sitemap.xml
Llms: ${siteConfig.url}/llms.txt
Llms-Full: ${siteConfig.url}/llms-full.txt
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
