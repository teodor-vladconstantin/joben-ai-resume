/**
 * Central sanitizer for AI provider errors.
 *
 * Goals:
 *   1. Never leak provider/vendor names (Anthropic, Claude, OpenAI, Gemini, etc.)
 *      or internal infrastructure details to the client.
 *   2. Map known failure classes to short, branded, user-facing messages.
 *   3. Surface a boolean flag indicating whether the client should prompt the
 *      user to upgrade (so the UpgradeModal can open for quota-style failures).
 *   4. Always keep the original error available for server-side logging.
 */

const PROVIDER_MENTIONS = /anthropic|claude|openai|chatgpt|gemini|google\s*ai|credit\s*balance|billing|api\s*key/i
const CREDIT_BALANCE_HINTS = /credit\s*balance|low[_\s-]*credit|payment\s*required|quota\s*exceeded|billing/i
const RATE_LIMIT_HINTS = /rate[_\s-]*limit|429|too\s*many\s*requests|overloaded/i
const AUTH_HINTS = /unauthorized|forbidden|invalid[_\s-]*api[_\s-]*key|401|403/i
const BAD_REQUEST_HINTS = /invalid[_\s-]*request|400|bad[_\s-]*request/i

export type SanitizedAiError = {
  /** Safe, branded message to return to the client. */
  userMessage: string
  /** Whether the UI should offer an upgrade path (opens UpgradeModal). */
  showUpgrade: boolean
  /** Short category for logs/metrics (never shown to the user). */
  category: 'quota' | 'rate_limit' | 'auth' | 'bad_request' | 'transient' | 'unknown'
  /** Raw error string — server-side only, never returned to the client. */
  raw: string
}

function extractRawMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}

/**
 * Map an unknown thrown value into a user-safe error description.
 *
 * The returned `userMessage` is always free of provider/vendor names. When the
 * caller sends `showUpgrade: true` to the client the UI can open the upgrade
 * modal; otherwise it should render the plain message in an error banner.
 */
export function sanitizeAiError(error: unknown): SanitizedAiError {
  const raw = extractRawMessage(error)

  if (CREDIT_BALANCE_HINTS.test(raw)) {
    return {
      userMessage:
        'AI features are temporarily unavailable. Please try again in a few minutes — or upgrade your plan for priority access.',
      showUpgrade: true,
      category: 'quota',
      raw,
    }
  }

  if (RATE_LIMIT_HINTS.test(raw)) {
    return {
      userMessage: 'AI service is busy right now. Please wait a moment and try again.',
      showUpgrade: false,
      category: 'rate_limit',
      raw,
    }
  }

  if (AUTH_HINTS.test(raw)) {
    return {
      userMessage: 'AI service is misconfigured. Please contact support.',
      showUpgrade: false,
      category: 'auth',
      raw,
    }
  }

  if (BAD_REQUEST_HINTS.test(raw)) {
    return {
      userMessage: 'We could not process that request. Please adjust your input and try again.',
      showUpgrade: false,
      category: 'bad_request',
      raw,
    }
  }

  // Fallback: hide any provider mention that slipped through.
  if (PROVIDER_MENTIONS.test(raw)) {
    return {
      userMessage: 'AI service is temporarily unavailable. Please try again soon.',
      showUpgrade: false,
      category: 'transient',
      raw,
    }
  }

  return {
    userMessage: 'AI service is temporarily unavailable. Please try again soon.',
    showUpgrade: false,
    category: 'unknown',
    raw,
  }
}

/**
 * Strip provider/vendor mentions from an arbitrary string. Use this for any
 * error message that may have been constructed server-side and might still
 * include `Anthropic`, `Claude`, etc.
 */
export function stripProviderMentions(message: string): string {
  if (!message) return message
  if (!PROVIDER_MENTIONS.test(message)) return message
  return 'AI service is temporarily unavailable. Please try again soon.'
}
