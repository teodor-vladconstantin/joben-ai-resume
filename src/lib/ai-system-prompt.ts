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
