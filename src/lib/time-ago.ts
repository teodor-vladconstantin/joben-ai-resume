// Shared "N units ago" formatter used by list pages (resumes, cover letters).
// Intl does the wording and plurals per locale; the hand-rolled English
// version showed "3 days ago" on the Romanian UI.
const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
]

export function timeAgo(dateValue: string, locale: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateValue).getTime()) / 1000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (seconds >= size) return format.format(-Math.floor(seconds / size), unit)
  }
  return format.format(-Math.max(seconds, 0), 'second')
}
