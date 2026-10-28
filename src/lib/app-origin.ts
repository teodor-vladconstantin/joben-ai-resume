// Marketing site (joben.eu) vs authenticated app (app.joben.eu), one codebase.
// NEXT_PUBLIC_APP_ORIGIN unset (local dev, previews) keeps everything on one host.
export const APP_ORIGIN = (process.env.NEXT_PUBLIC_APP_ORIGIN || '').replace(/\/$/, '')
export const SITE_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

// Pages that need an account. `?` ends a segment so hrefs with a query match too.
const APP_PATH = /^\/(?:(?:ro|en)\/)?(?:dashboard|resumes|cover-letters|ai-review|feedback|settings|sign-in|sign-up)(?:[/?]|$)/

export function isAppPath(path: string): boolean {
  return APP_PATH.test(path)
}
