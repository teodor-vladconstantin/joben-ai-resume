// SECURITY: central sanitizer for user-controlled text that flows into an AI
// prompt. It hardens us against prompt-injection (CLAUDE.md High #3) and
// caps token spend by truncating long inputs.
//
// Apply this to any field that is concatenated into a Claude / Gemini /
// OpenAI prompt template (resume text, job description, bullet, role
// description, improvement examples, etc.).

const DEFAULT_MAX_CHARS = 10_000

const HTML_TAG_RE = /<\/?[a-zA-Z][^>]*>/g

// Patterns that try to subvert the system prompt by addressing the model
// directly. We strip them rather than rejecting the request because legit
// resume copy occasionally contains these phrases inside larger sentences.
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(previous|all|prior|above)\s+instructions?/gi,
  /disregard\s+(previous|all|prior|above)\s+instructions?/gi,
  /forget\s+(previous|all|prior|above)\s+instructions?/gi,
  /new\s+instructions?\s*:/gi,
  /\bsystem\s*:\s*/gi,
  /\bassistant\s*:\s*/gi,
  /<\|?(?:im_(?:start|end)|system|user|assistant|endoftext|fim_(?:prefix|middle|suffix))\|?>/gi,
  /\[\s*INST\s*\]/gi,
  /\[\s*\/INST\s*\]/gi,
  /<<\s*SYS\s*>>/gi,
  /<<\s*\/SYS\s*>>/gi,
]

export type SanitizeOptions = {
  /** Maximum number of characters to keep. Defaults to 10 000. */
  maxChars?: number
  /** Strip HTML tags entirely (default true). */
  stripHtml?: boolean
}

/**
 * Sanitize a single user-supplied string before injecting it into an AI
 * prompt. Safe to call on `undefined`/`null`; returns an empty string in that
 * case so callers do not need to null-check.
 */
export function sanitizeForPrompt(input: string | null | undefined, options: SanitizeOptions = {}): string {
  if (!input) return ''

  const maxChars = options.maxChars ?? DEFAULT_MAX_CHARS
  const stripHtml = options.stripHtml ?? true

  let value = input.slice(0, maxChars)

  if (stripHtml) {
    value = value.replace(HTML_TAG_RE, ' ')
  }

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    value = value.replace(pattern, ' ')
  }

  // Collapse whitespace so the substituted patterns leave clean text.
  value = value.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim()

  return value
}

/**
 * Recursively sanitize every string inside a plain JSON-serializable value
 * (object, array, primitive). Useful when the caller injects an entire
 * `resumeData` JSON blob into a prompt.
 */
export function sanitizeJsonForPrompt<T>(value: T, options: SanitizeOptions = {}): T {
  if (value == null) return value
  if (typeof value === 'string') return sanitizeForPrompt(value, options) as unknown as T
  if (Array.isArray(value)) return value.map((item) => sanitizeJsonForPrompt(item, options)) as unknown as T
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeJsonForPrompt(v, options)
    }
    return out as unknown as T
  }
  return value
}
