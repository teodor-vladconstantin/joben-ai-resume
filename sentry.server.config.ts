// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import { scrubSentryEvent } from "@/lib/security/sentry-scrub";

// Native CPU profiler. A load failure (missing binary in the Vercel function)
// must never take the server down, so profiling is simply skipped.
function profilingIntegrations() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { nodeProfilingIntegration } = require("@sentry/profiling-node");
    return [nodeProfilingIntegration()];
  } catch {
    return [];
  }
}

Sentry.init({
  dsn: "https://39e304482d48c2d9aeb663a996b3d8ea@o4511258775388160.ingest.de.sentry.io/4511258779254864",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1,

  // Profile a sample of sessions, only while a trace is active.
  integrations: profilingIntegrations(),
  profileSessionSampleRate: 0.1,
  profileLifecycle: "trace",

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
  beforeSend: scrubSentryEvent,
});
