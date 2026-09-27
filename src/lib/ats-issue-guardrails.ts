// Hard guardrail on top of the prompt rules: the model keeps re-raising these
// categories despite being told not to, so any finding matching them is
// dropped in code before it reaches the user, the DB, or an email.
// ponytail: keyword heuristic, may drop a rare legit finding that mentions these words.
const FALSE_POSITIVE_PATTERNS: RegExp[] = [
  // Concurrent roles are normal (founder + job, part-time gigs).
  /overlap|concurrent|simultaneous|at the same time|part-time|time allocation/i,
  // Our own extraction/char cap cuts text; never the candidate's fault.
  /truncat|cut(s)? off|mid-sentence|ends abruptly|incomplete (content|entry|sentence|text)/i,
  // Date/tenure arithmetic the model gets wrong.
  /mathematically|impossible|duration|tenure|\d+\s*(years?|months?)\s+(label|stated|listed)/i,
  /graduation date/i,
  /future date|in the future/i,
]

function findingText(finding: unknown): string {
  if (typeof finding === 'string') return finding
  if (!finding || typeof finding !== 'object') return ''
  // Only the finding's own claim; weak/strong examples quote the CV itself
  // ("managed part-time staff") and must not trigger a drop.
  const { issue, explanation } = finding as { issue?: unknown; explanation?: unknown }
  return [issue, explanation].filter((v): v is string => typeof v === 'string').join(' ')
}

function isFalsePositive(finding: unknown): boolean {
  const text = findingText(finding)
  return FALSE_POSITIVE_PATTERNS.some((pattern) => pattern.test(text))
}

/**
 * Returns the AI result with known false-positive findings removed from the
 * given array fields (e.g. `issues`, `improvements`, `ats_warnings`).
 */
export function stripFalsePositiveIssues<T>(result: T, fields: string[] = ['issues']): T {
  if (!result || typeof result !== 'object') return result
  const out: Record<string, unknown> = { ...(result as Record<string, unknown>) }
  for (const field of fields) {
    const value = out[field]
    if (Array.isArray(value)) out[field] = value.filter((finding) => !isFalsePositive(finding))
  }
  return out as T
}
