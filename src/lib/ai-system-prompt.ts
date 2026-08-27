/**
 * Claude has no built-in sense of "today" — it defaults to assuming the
 * current date is near its training cutoff. Without this notice it flags
 * valid resume dates (current year, "Present", recent graduations) as
 * future-dated or chronologically inconsistent — a false positive.
 * Every system prompt sent to the API must be wrapped with this.
 */
export function withCurrentDateContext(system: string): string {
  const today = new Date().toISOString().slice(0, 10)
  return `Today's real-world date is ${today}. This is authoritative — your training data has an earlier knowledge cutoff, so do not assume the current year matches it. Use ${today} when judging whether dates in the resume or job description are in the future, ongoing ("Present"), or chronologically consistent.\n\n${system}`
}
