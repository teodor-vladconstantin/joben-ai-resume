// Marketing site (joben.eu) vs authenticated app (app.joben.eu), one codebase.
// NEXT_PUBLIC_APP_ORIGIN unset (local dev, previews) keeps everything on one host.
// A mistyped value (e.g. https://app/joben.eu) must disable the split, not ship broken links.
export function cleanOrigin(value: string | undefined): string {
  try {
    const url = new URL(value || '')
    return url.pathname === '/' && url.hostname.includes('.') ? url.origin : ''
  } catch {
    return ''
  }
}

export const APP_ORIGIN = cleanOrigin(process.env.NEXT_PUBLIC_APP_ORIGIN)
export const SITE_ORIGIN = cleanOrigin(process.env.NEXT_PUBLIC_APP_URL)

// Pages that need an account. `?` ends a segment so hrefs with a query match too.
const APP_PATH = /^\/(?:(?:ro|en)\/)?(?:dashboard|resumes|cover-letters|ai-review|feedback|settings|sign-in|sign-up)(?:[/?]|$)/

export function isAppPath(path: string): boolean {
  return APP_PATH.test(path)
}
