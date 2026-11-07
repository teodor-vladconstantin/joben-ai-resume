// Version of the Terms, Privacy Policy and Cookie Policy that users accept.
//
// HOW TO PUBLISH A LEGAL CHANGE (see docs/legal/LEGAL-CHANGE-PROCESS.md):
// 1. Edit the document copy in messages/*.json.
// 2. Add a new entry at the TOP of LEGAL_CHANGELOG with the new version (ISO date)
//    and a short list of what changed in Romanian and English.
// 3. Merge. Signed-in users are asked to accept again (components/legal/
//    TermsReacceptance.tsx) and every user who has not accepted the new version
//    gets an email once (api/cron/legal-change-notice, run daily and after a push
//    by .github/workflows/legal-change-notice.yml).
// A typo fix that needs neither re-acceptance nor emails gets no new entry.
// notify: false records a version without emailing anyone.

export type LegalChange = {
  version: string
  notify: boolean
  ro: string[]
  en: string[]
}

export const LEGAL_CHANGELOG: readonly LegalChange[] = [
  {
    version: '2026-11-07',
    notify: true,
    ro: [
      'Datele din baza noastră de date sunt acum găzduite în Uniunea Europeană (Germania).',
      'Pagini noi: lista furnizorilor (subprocesatori) și politica de rambursare și drept de retragere.',
      'Funcția online «Retrage-te din contract aici» pentru dreptul de retragere de 14 zile.',
      'Confirmi la înregistrare că ai cel puțin 16 ani, iar Politica de Confidențialitate descrie importul fișierelor CV prin serverul nostru de procesare.',
    ],
    en: [
      'The data in our database is now hosted in the European Union (Germany).',
      'New pages: the list of providers (subprocessors) and the refund policy and right of withdrawal.',
      'The online "Withdraw from contract here" function for the 14-day right of withdrawal.',
      'You confirm at sign-up that you are at least 16 years old, and the Privacy Policy describes how CV file imports go through our processing server.',
    ],
  },
]

export const LEGAL_VERSION = LEGAL_CHANGELOG[0].version
