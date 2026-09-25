import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

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
const isUnlocalizedRoute = createRouteMatcher(['/api(.*)', '/parse(.*)', '/ingest(.*)', '/monitoring(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  if (isUnlocalizedRoute(req)) {
    return
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}
