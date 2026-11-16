import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AnalyticsGate } from '@/components/AnalyticsGate'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GtmGate } from '@/components/GtmGate'
import { PostHogProvider } from '@/components/PostHogProvider'
import { WebVitalsReporter } from '@/components/WebVitalsReporter'
import { ScrollProgress } from '@/components/motion/ScrollProgress'
import { GridOverlay } from '@/components/motion/GridOverlay'

// GA4 is configured inside the GTM container (not here): the container sends
// to G-PGLHWSE720 through its Google tag destination and GA4 event tags.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <PostHogProvider>
        <ScrollProgress />
        <GridOverlay />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              borderRadius: 0,
            },
          }}
        />
        <WebVitalsReporter />
        <AnalyticsGate />
        <SpeedInsights />
        {GTM_ID && <GtmGate gtmId={GTM_ID} />}
      </PostHogProvider>
    </ThemeProvider>
  )
}
