import type { AppLocale } from '@/i18n/routing'

type Localized = Record<AppLocale, string>

export type Subprocessor = {
  name: string
  purpose: Localized
  data: Localized
  location: Localized
  consent?: boolean
}

// Keep in sync with Privacy Policy section 4 (messages/*.json, Legal.privacy)
// and docs/legal/ROPA.md.
export const SUBPROCESSORS: readonly Subprocessor[] = [
  {
    name: 'Anthropic',
    purpose: { ro: 'Procesare AI (modelele Claude): analiza CV, rescriere, scrisori, import de fișiere', en: 'AI processing (Claude models): CV analysis, rewriting, cover letters, file import' },
    data: { ro: 'Textul CV-ului sau al câmpurilor trimise, descrierea jobului', en: 'Text of the CV or fields you send, job description' },
    location: { ro: 'SUA', en: 'USA' },
  },
  {
    name: 'Supabase',
    purpose: { ro: 'Bază de date a aplicației', en: 'Application database' },
    data: { ro: 'Cont, CV-uri, scrisori, analize, evenimente de produs', en: 'Account, CVs, cover letters, analyses, product events' },
    location: { ro: 'AWS, regiunea US-East (SUA)', en: 'AWS, US-East region (USA)' },
  },
  {
    name: 'Clerk',
    purpose: { ro: 'Autentificare și gestionarea contului', en: 'Authentication and account management' },
    data: { ro: 'Email, nume, metoda de autentificare', en: 'Email, name, sign-in method' },
    location: { ro: 'SUA', en: 'USA' },
  },
  {
    name: 'Stripe',
    purpose: { ro: 'Plăți și facturare (și operator independent pentru prevenirea fraudei)', en: 'Payments and billing (also an independent controller for fraud prevention)' },
    data: { ro: 'Identificatori client/abonament, plan, date de plată introduse la Stripe', en: 'Customer/subscription IDs, plan, payment details entered at Stripe' },
    location: { ro: 'SUA / UE', en: 'USA / EU' },
  },
  {
    name: 'Resend',
    purpose: { ro: 'Trimiterea emailurilor de serviciu', en: 'Sending service emails' },
    data: { ro: 'Adresa de email, conținutul emailului', en: 'Email address, email content' },
    location: { ro: 'SUA', en: 'USA' },
  },
  {
    name: 'Upstash',
    purpose: { ro: 'Limitarea ratei de utilizare și cache', en: 'Rate limiting and cache' },
    data: { ro: 'Identificator de utilizator sau hash de IP, contori (ore până la o lună)', en: 'User identifier or IP hash, counters (hours up to one month)' },
    location: { ro: 'Conform configurației serviciului (vezi Politica de confidențialitate, secțiunea 5)', en: 'As configured for the service (see Privacy Policy, section 5)' },
  },
  {
    name: 'Vercel',
    purpose: { ro: 'Găzduirea aplicației și metrici de performanță agregate', en: 'Application hosting and aggregated performance metrics' },
    data: { ro: 'Cereri HTTP, loguri tehnice', en: 'HTTP requests, technical logs' },
    location: { ro: 'SUA / rețea globală', en: 'USA / global network' },
  },
  {
    name: 'Oracle Cloud Infrastructure',
    purpose: { ro: 'Server care citește fișierele CV și generează PDF-uri', en: 'Server that parses CV files and generates PDFs' },
    data: { ro: 'Fișierul CV încărcat, procesat temporar', en: 'Uploaded CV file, processed temporarily' },
    location: { ro: 'Conform configurației serviciului (vezi Politica de confidențialitate, secțiunea 5)', en: 'As configured for the service (see Privacy Policy, section 5)' },
  },
  {
    name: 'Sentry',
    purpose: { ro: 'Monitorizarea erorilor; Replay doar cu consimțământ', en: 'Error monitoring; Replay only with consent' },
    data: { ro: 'Erori tehnice, IP, identificator de utilizator; înregistrări de sesiune cu consimțământ', en: 'Technical errors, IP, user identifier; session recordings with consent' },
    location: { ro: 'UE', en: 'EU' },
    consent: true,
  },
  {
    name: 'PostHog',
    purpose: { ro: 'Analitice de produs și înregistrări de sesiune, doar cu consimțământ', en: 'Product analytics and session recordings, only with consent' },
    data: { ro: 'Evenimente de utilizare, înregistrări de sesiune cu câmpurile de text mascate', en: 'Usage events, session recordings with text fields masked' },
    location: { ro: 'UE', en: 'EU' },
    consent: true,
  },
  {
    name: 'Google Ireland Limited',
    purpose: { ro: 'Google Analytics 4 prin Google Tag Manager, doar cu consimțământ', en: 'Google Analytics 4 through Google Tag Manager, only with consent' },
    data: { ro: 'Evenimente de navigare și identificatori de browser', en: 'Browsing events and browser identifiers' },
    location: { ro: 'Irlanda, cu posibil transfer în SUA', en: 'Ireland, with possible transfer to the USA' },
    consent: true,
  },
] as const
