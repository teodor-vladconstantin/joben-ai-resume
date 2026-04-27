import * as Sentry from "@sentry/nextjs";
import { apiError, getErrorMessage } from '@/lib/api-response'

export const dynamic = "force-dynamic";

class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = "SentryExampleAPIError";
  }
}

// A faulty API route to test Sentry's error monitoring
export function GET() {
  try {
    Sentry.logger.info("Sentry example API called");
    const error = new SentryExampleAPIError(
      "This error is raised on the backend called by the example page.",
    );
    Sentry.captureException(error);
    return apiError(error.message, 500);
  } catch (error) {
    Sentry.captureException(error);
    return apiError(getErrorMessage(error), 500);
  }
}
