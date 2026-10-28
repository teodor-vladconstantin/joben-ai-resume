import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import { routing } from '@/i18n/routing'
import { resolveMarkdownTarget, wantsMarkdown } from '@/lib/agent-markdown'
import { CLERK_PROXY_ENABLED, CLERK_PROXY_PATH } from '@/lib/clerk-proxy'
import { APP_ORIGIN, SHARED_COOKIE_DOMAIN, SITE_ORIGIN, isAppPath } from '@/lib/app-origin'

// Two hosts, one deployment: joben.eu serves the marketing/SEO pages and
// app.joben.eu the account pages. The split is active only when both origins
// are configured and differ, so local dev and preview URLs stay single-host.
const appHost = APP_ORIGIN ? new URL(APP_ORIGIN).host : ''
const siteHost = SITE_ORIGIN ? new URL(SITE_ORIGIN).host : ''
const splitHosts = Boolean(appHost && siteHost && appHost !== siteHost)
// Shared parent domain (".joben.eu") so cookies set on one host reach the other.
const cookieDomain = SHARED_COOKIE_DOMAIN

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
  if (splitHosts && req.method === 'GET' && !isUnlocalizedRoute(req)) {
    const { pathname, search } = req.nextUrl
    const host = req.headers.get('host')
    if (host === siteHost && isAppPath(pathname)) {
      return NextResponse.redirect(`${APP_ORIGIN}${pathname}${search}`)
    }
    if (host === appHost && !isAppPath(pathname)) {
      // The app has no landing page: its root is the dashboard, which sends
      // signed-out visitors to sign-in. Anything else is a marketing page.
      const rootLocale = pathname.match(/^\/(ro|en)?\/?$/)
      if (rootLocale) {
        return NextResponse.redirect(`${APP_ORIGIN}/${rootLocale[1] ?? routing.defaultLocale}/dashboard`)
      }
      return NextResponse.redirect(`${SITE_ORIGIN}${pathname}${search}`)
    }
  }

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

  // Referral link: first touch wins for 30 days. Readable by the sign-up page,
  // which copies it into Clerk unsafeMetadata; the webhook re-validates it.
  const refCode = (req.nextUrl.searchParams.get('ref') || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30)
  if (refCode && !req.cookies.has('jb_ref')) {
    res.cookies.set('jb_ref', refCode, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      domain: cookieDomain,
    })
  }

  return res
}, { frontendApiProxy: { enabled: CLERK_PROXY_ENABLED, path: CLERK_PROXY_PATH } })

export const config = {
  // /__clerk is listed on its own: its script URLs contain dots, which the first pattern skips.
  matcher: ['/((?!_next|.*\\..*).*)', '/__clerk/(.*)'],
}
