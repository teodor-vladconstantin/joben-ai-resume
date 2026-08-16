"use client"

import { usePathname } from 'next/navigation'
import { SiteFooter } from '@/components/layout/SiteFooter'

const FULL_SCREEN_EDITOR_PATTERNS = [
  /^\/resumes\/new$/,
  /^\/resumes\/[^/]+$/,
  /^\/cover-letters\/new$/,
  /^\/cover-letters\/[^/]+$/,
]

export function ConditionalFooter() {
  const pathname = usePathname()

  const isFullScreenEditor = FULL_SCREEN_EDITOR_PATTERNS.some((pattern) => pattern.test(pathname))

  if (isFullScreenEditor) {
    return null
  }

  return <SiteFooter />
}
