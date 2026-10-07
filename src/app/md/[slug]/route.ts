import { homeMarkdown, notFoundMarkdown } from '@/lib/agent-markdown'

// Internal target of the proxy's Accept: text/markdown rewrite.
export const dynamic = 'force-dynamic'

const HEADERS = { 'Content-Type': 'text/markdown; charset=utf-8', Vary: 'Accept' }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (slug === 'home-ro' || slug === 'home-en') {
    return new Response(homeMarkdown(slug === 'home-en' ? 'en' : 'ro'), { headers: HEADERS })
  }
  return new Response(notFoundMarkdown(), { status: 404, headers: HEADERS })
}
