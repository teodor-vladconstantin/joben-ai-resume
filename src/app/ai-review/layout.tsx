import type { Metadata } from 'next'

// ai-review/page.tsx and its children are client components, so metadata
// can't live on the page itself. Authenticated-only pages: noindex so a
// leaked URL doesn't inherit the homepage's title/OG data.
export const metadata: Metadata = {
  title: 'AI Review | Joben',
  robots: { index: false, follow: false },
}

export default function AiReviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
