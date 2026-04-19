import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/resumes(.*)',
  '/cover-letters(.*)',
  '/ai-review(.*)',
])

export default clerkMiddleware(
  async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect()
    }
  },
  {
    signInUrl: '/sign-in',
    signUpUrl: '/sign-up',
  }
)

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
