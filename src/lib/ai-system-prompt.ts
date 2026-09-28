/**
 * Claude has no built-in sense of "today" — it defaults to assuming the
 * current date is near its training cutoff. Without this notice it flags
 * valid resume dates (current year, "Present", recent graduations) as
 * future-dated or chronologically inconsistent — a false positive.
 * Every system prompt sent to the API must be wrapped with this.
 */
export function withCurrentDateContext(system: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `Today's real-world date is ${today}. This is authoritative — your training data has an earlier knowledge cutoff, so do not assume the current year matches it. Before calling ANY date (a job, a project, a certification, a training, an education entry) "future-dated" or "inconsistent", explicitly compare it against ${today}: a date is only in the future if it is literally later than ${today}. A date earlier than or equal to ${today} — even one that falls in ${today.slice(0, 4)} or looks close to your training cutoff — already happened and is never a future-dating issue.\n\n${system}`
}

/**
 * Appended to scoring prompts so feedback matches the UI language (Romanian
 * users used to get English issues). Keys, enums and anything quoted from
 * the resume stay as-is, since code matches them against the source text.
 */
export function outputLanguageRule(locale: string | null | undefined): string {
  if (locale !== 'ro') return ''
  return '\n\nWrite every human-readable string in Romanian, including every "issue", "explanation", "feedback", "strengths", "ats_warnings" and improvement "issue" value; never mix English and Romanian inside one answer. Keep JSON keys, enum values and grades in English, and copy weak examples and keywords exactly as they appear in the resume or job description.'
}

/** Shared rule: a Romanian (or other-language) resume is not a formatting error. */
export const RESUME_LANGUAGE_RULE =
  '- The resume may be written in Romanian or another language. Its month names and abbreviations (Ian, Iun, Iul, Oct...), "Prezent", section headings and diacritics are correct: never flag them as typos, non-standard formats or extraction artifacts.'

/** The resume text is our rendering: its layout is not the candidate's formatting. */
export const RENDERED_TEXT_RULE =
  '- The resume text was rendered to plain text by our system: bullet characters, dashes, separators (|) and line layout come from that rendering, not from the candidate. Never comment on them.'
