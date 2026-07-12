import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleTagManager } from '@next/third-parties/google'
import { PostHogProvider } from '@/components/PostHogProvider'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'

// GA4 is configured inside the GTM container (not here) — add a
// "Google Analytics: GA4 Configuration" tag pointed at G-FBR6C4DH8B
// with an "All Pages" trigger in the GTM UI.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      {children}
      <WebVitalsReporter />
      <Analytics />
      <SpeedInsights />
      {GTM_ID && <GoogleTagManager gtmId={GTM_ID} />}
    </PostHogProvider>
  )
}
