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

// /api and /parse are not localized (they're not pages, no [locale] segment).
// Clerk still needs to run on them for auth() context, but next-intl's
// redirect/rewrite logic must not touch them.
const isUnlocalizedRoute = createRouteMatcher(['/api(.*)', '/parse(.*)'])

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
