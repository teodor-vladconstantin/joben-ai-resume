import * as Sentry from '@sentry/nextjs'

// Session Replay records the visitor's screen, so it only runs after analytics
// consent. Error reporting without replay stays on (legitimate interest).
export function enableSentryReplay(): void {
  if (typeof window === 'undefined' || Sentry.getReplay()) return
  Sentry.addIntegration(Sentry.replayIntegration())
}
