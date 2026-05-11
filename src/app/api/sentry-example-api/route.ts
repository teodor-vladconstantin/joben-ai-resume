import * as Sentry from "@sentry/nextjs";
import { apiError } from '@/lib/api-response'
import { clientErrorMessage } from '@/lib/security/client-error'

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  // SECURITY: CLAUDE.md Medium #1 — keep this test-only route invisible in
  // production so it does not leak to scanners or pollute the attack surface.
  if (process.env.NODE_ENV === 'production') {
    return apiError(clientErrorMessage('not_found'), 404)
  }

  try {
    Sentry.logger.info("Sentry example API called");
    const error = new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
    Sentry.captureException(error);
    return apiError(error.message, 500);
  } catch (error) {
    Sentry.captureException(error);
    return apiError(clientErrorMessage('server'), 500);
  }
}
