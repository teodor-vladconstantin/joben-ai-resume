import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@next/third-parties/google'
import { PostHogProvider } from '@/components/PostHogProvider'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      {children}
      <WebVitalsReporter />
      <Analytics />
      <SpeedInsights />
      {GA_MEASUREMENT_ID && <GoogleAnalytics gaId={GA_MEASUREMENT_ID} />}
    </PostHogProvider>
  )
}
