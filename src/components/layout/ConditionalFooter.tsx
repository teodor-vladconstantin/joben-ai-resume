"use client"

import { usePathname } from '@/i18n/navigation'

const FULL_SCREEN_EDITOR_PATTERNS = [
  /^\/resumes\/new$/,
  /^\/resumes\/[^/]+$/,
  /^\/cover-letters\/new$/,
  /^\/cover-letters\/[^/]+$/,
]

// SiteFooter is a Server Component (it reads translations server-side via
// next-intl/server), so it's rendered by the parent layout and passed in
// here rather than imported directly — a "use client" file can't import an
// async server-only component and instantiate it itself.
export function ConditionalFooter({ footer }: { footer: React.ReactNode }) {
  const pathname = usePathname()

  const isFullScreenEditor = FULL_SCREEN_EDITOR_PATTERNS.some((pattern) => pattern.test(pathname))

  if (isFullScreenEditor) {
    return null
  }

  return footer
}
