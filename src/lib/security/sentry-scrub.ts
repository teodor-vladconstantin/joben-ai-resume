import type { ErrorEvent, TransactionEvent } from '@sentry/core'

// sendDefaultPii + Sentry.captureRequestError (src/instrumentation.ts) can
// attach the raw request body to an event for an uncaught exception on any
// route — including the CV-processing routes (parse/analyze/tailor/etc.),
// whose body contains resume text. Strip it before the event leaves the
// process; IP/cookies are left intact since those are needed for abuse
// investigation and are covered as "legitimate interest" in the privacy policy.
export function scrubSentryEvent<T extends ErrorEvent | TransactionEvent>(event: T): T {
  if (event.request?.data) {
    event.request.data = '[Stripped]'
  }
  return event
}
