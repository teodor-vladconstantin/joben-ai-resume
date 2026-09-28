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
  /(graduation|completion|end) (date|year)|degree completion|no GPA|GPA (is )?missing/i,
  // The model reads OUR plain-text rendering of the resume, so dashes, bullet
  // characters and separators are ours, never the candidate's formatting.
  /(dashes?|hyphens?) (vs\.?|versus|instead of|and|or) bullets?|bullets? (vs\.?|versus|instead of) (dashes?|hyphens?)|inconsistent (bullet|list) (style|format)|liniuț\w* (în loc de|și) (buline|bullet)/i,
  /future date|in the future/i,
  // We only send extracted text: visual elements are invisible to the model,
  // so any claim about them is a guess.
  /\b(images?|icons?|photos?|pictures?|graphics?|colou?rs?|fonts?|headers? (and|or) footers?)\b/i,
  // Any readable phone number is fine for ATS; "formatting" nitpicks are noise.
  /\bphone\b.*\b(format|placeholder)/i,
  // The model doubting that the candidate's own data is real.
  /placeholder|not (actually )?(earned|real)|fabricat|verify (it|this) is (real|accurate)/i,
  // Month names/abbreviations in the resume's own language (Romanian "Ian").
  /(non-standard|typo|artifact|instead of).*(month|date|abbreviation)|(month|date) abbreviation|abrevier\w* (a )?lun|denumir\w* lun/i,
  // Romanian equivalents: feedback is written in Romanian for /ro users, and
  // the English patterns above would silently stop matching.
  /suprapu|simultan|concomitent|în același timp|normă parțială/i,
  /trunchiat|se termină brusc|mijlocul (unei )?propoziți|conținut incomplet|intrare incompletă/i,
  /durat[aă] (declarat|menționat)|vechime|imposibil|matematic/i,
  /(an|dat)[aă]? (de )?(absolvir|finaliz)|lipse\w* (media|GPA)/i,
  /(dat[aă]|date) (din|în) viitor/i,
  /\b(imagin|iconi|pictogram|fotografi|grafic|culor|fonturi|antet\w* (și|sau) subsol)/i,
  /\btelefon\w*.*format|substituent|fictiv|verific\w* dacă (este|e) real/i,
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
