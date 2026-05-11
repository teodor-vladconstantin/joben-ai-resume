// SECURITY: helper that returns SAFE, branded error messages to the client.
// We must never leak Supabase error.message, internal IDs, schema names, or
// stack traces to end users (CLAUDE.md High #1). Use this in place of
// `getErrorMessage` whenever the result is part of a JSON response body.
//
// Server-side logs still receive the original error via @/lib/logger so
// debugging is unaffected.

export type ClientErrorCategory =
  | 'auth'
  | 'forbidden'
  | 'not_found'
  | 'invalid_input'
  | 'conflict'
  | 'rate_limit'
  | 'server'
  | 'unavailable'

const DEFAULT_MESSAGES: Record<ClientErrorCategory, string> = {
  auth: 'Authentication required.',
  forbidden: 'You do not have access to this resource.',
  not_found: 'Resource not found.',
  invalid_input: 'The request payload is invalid.',
  conflict: 'The resource is in a conflicting state. Please retry.',
  rate_limit: 'Too many requests. Please slow down and retry shortly.',
  server: 'Something went wrong. Please try again.',
  unavailable: 'Service temporarily unavailable. Please try again soon.',
}

/**
 * Return a stable, user-safe message for a given category. Pass an
 * `override` only if you have already verified the string is safe (e.g. a
 * curated copy like "Resume not found").
 */
export function clientErrorMessage(category: ClientErrorCategory, override?: string): string {
  if (override && typeof override === 'string' && override.trim().length > 0) {
    return override
  }
  return DEFAULT_MESSAGES[category]
}

/**
 * Convenience map for common HTTP status codes.
 */
export function clientErrorForStatus(status: number, override?: string): string {
  if (override) return override
  if (status === 401) return DEFAULT_MESSAGES.auth
  if (status === 403) return DEFAULT_MESSAGES.forbidden
  if (status === 404) return DEFAULT_MESSAGES.not_found
  if (status === 400 || status === 422) return DEFAULT_MESSAGES.invalid_input
  if (status === 409) return DEFAULT_MESSAGES.conflict
  if (status === 429) return DEFAULT_MESSAGES.rate_limit
  if (status === 503) return DEFAULT_MESSAGES.unavailable
  return DEFAULT_MESSAGES.server
}
