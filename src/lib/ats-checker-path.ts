// The ATS checker has a localized slug (same pattern as sabloane-cv/cv-templates).
export const ATS_CHECKER_SEGMENT = { ro: 'verificare-cv-ats', en: 'free-ats-checker' } as const

export function atsCheckerPath(locale: string) {
  return `/${ATS_CHECKER_SEGMENT[locale === 'en' ? 'en' : 'ro']}`
}
