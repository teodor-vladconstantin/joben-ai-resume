// Anti-hallucination check for AI-rewritten bullets (improve-bullet, tailor).
// Flags claims present in the rewritten text but absent from the source
// (original bullet + sibling context), so the UI can require explicit
// confirmation before saving instead of silently trusting the model.

import { callResumeParserJson } from '@/lib/resume-parser-client'
import { computeMissingSkills } from '@/lib/skill-gap'

// Spelled-out counts ("five years", "cinci ani") are the same claim as "5";
// without these a summary could say "ten years" and pass the check.
// ponytail: 2-20 + tens in EN/RO only; "one"/"un"/"opt" left out, too often not numbers.
const NUMBER_WORDS: Record<string, string> = {
  two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', thirteen: '13', fourteen: '14', fifteen: '15', sixteen: '16',
  seventeen: '17', eighteen: '18', nineteen: '19', twenty: '20', thirty: '30', forty: '40', fifty: '50',
  doi: '2', două: '2', doua: '2', trei: '3', patru: '4', cinci: '5', șase: '6', sase: '6', șapte: '7',
  sapte: '7', nouă: '9', zece: '10', douăzeci: '20', douazeci: '20',
}

const NUMBER_TOKEN_PATTERN = new RegExp(
  `\\d+(?:\\.\\d+)?%?|(?<!\\p{L})(?:${Object.keys(NUMBER_WORDS).join('|')})(?!\\p{L})`,
  'giu'
)

function bareNumber(token: string): string {
  return NUMBER_WORDS[token.toLowerCase()] ?? token.replace(/%$/, '')
}

/**
 * Pure, synchronous half of the check: numbers/percentages in `rewritten`
 * that don't appear (in bare-digit form, so "27" -> "27%" reformatting isn't
 * flagged) anywhere in `original` + `context`. Kept separate from
 * findNewClaims so it's directly unit-testable without mocking a network
 * call.
 */
export function findNewNumberClaims(original: string, context: string, rewritten: string): string[] {
  const haystack = `${original}\n${context}`
  const haystackNumbers = new Set(
    Array.from(haystack.matchAll(NUMBER_TOKEN_PATTERN), (match) => bareNumber(match[0]))
  )

  const seen = new Set<string>()
  const claims: string[] = []

  for (const match of rewritten.matchAll(NUMBER_TOKEN_PATTERN)) {
    const token = match[0]
    const bare = bareNumber(token)
    if (seen.has(bare)) continue
    seen.add(bare)
    if (!haystackNumbers.has(bare)) {
      claims.push(token)
    }
  }

  return claims
}

type ExtractSkillsResponse = { skills?: string[] }

async function extractToolsForClaimCheck(text: string): Promise<string[]> {
  const trimmed = text.trim()
  if (!trimmed) return []

  try {
    const response = await callResumeParserJson<ExtractSkillsResponse>('/extract-skills', {
      text: trimmed.slice(0, 8_000),
      lang: 'en',
    })
    return Array.isArray(response.skills) ? response.skills : []
  } catch {
    // Best-effort: a resume-parser outage should not block the tool-diff
    // half of the check, only skip it (number-based detection still runs).
    return []
  }
}

/**
 * Full anti-hallucination check: new/changed numbers-percentages (pure,
 * see findNewNumberClaims) plus new tools/technologies, detected via the
 * same ESCO-backed skill extractor exposed for Tailor v2's job-description
 * gap analysis (resume-parser-service's /extract-skills). Async because the
 * tool-diff half requires a network call — the numeric half alone would not.
 */
export async function findNewClaims(original: string, context: string, rewritten: string): Promise<string[]> {
  const haystack = `${original}\n${context}`
  const numberClaims = findNewNumberClaims(original, context, rewritten)

  const [rewrittenTools, haystackTools] = await Promise.all([
    extractToolsForClaimCheck(rewritten),
    extractToolsForClaimCheck(haystack),
  ])
  const toolClaims = computeMissingSkills(haystackTools, rewrittenTools)

  return [...numberClaims, ...toolClaims]
}
