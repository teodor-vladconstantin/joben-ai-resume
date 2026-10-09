import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { resolveMarkdownTarget, wantsMarkdown } from '@/lib/agent-markdown'

const intlMiddleware = createMiddleware(routing)

const isProtectedRoute = createRouteMatcher([
  '/(ro|en)/dashboard(.*)',
  '/(ro|en)/resumes(.*)',
  '/(ro|en)/cover-letters(.*)',
  '/(ro|en)/ai-review(.*)',
  '/(ro|en)/feedback(.*)',
])

// /api, /parse, /ingest, and /monitoring are not localized (they're not
// pages, no [locale] segment). Clerk still needs to run on them for
// auth() context, but next-intl's redirect/rewrite logic must not touch
// them. /ingest is PostHog's proxy (rewritten in next.config.ts) and
// /monitoring is Sentry's tunnel (tunnelRoute in next.config.ts) — with
// localePrefix: 'always', next-intl was prefixing both to /ro/..., which
// neither rewrite matches anymore, so every request 404'd.
const isUnlocalizedRoute = createRouteMatcher(['/api(.*)', '/parse(.*)', '/ingest(.*)', '/monitoring(.*)', '/md(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Redirect to our own embedded sign-in page, not Clerk's hosted portal.
    const { userId } = await auth()
    if (!userId) {
      const locale = req.nextUrl.pathname.split('/')[1]
      const url = new URL(`/${locale}/sign-in`, req.url)
      url.searchParams.set('redirect_url', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(url)
    }
  }

  if (isUnlocalizedRoute(req)) {
    return
  }

  if (req.method === 'GET' && wantsMarkdown(req.headers.get('accept'))) {
    const target = resolveMarkdownTarget(req.nextUrl.pathname)
    if (target) {
      const url = req.nextUrl.clone()
      url.pathname = target.kind === 'home' ? `/md/home-${target.locale}` : '/md/not-found'
      return NextResponse.rewrite(url)
    }
  }

  const res = intlMiddleware(req)
  res.headers.append('Vary', 'Accept')
  return res
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
