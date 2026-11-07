// Data minimisation before text goes to the AI provider (GDPR art. 5(1)(c)).
// Scoring does not need the candidate's reachable contact details, so emails,
// phone numbers and profile URLs are replaced by neutral placeholders. The
// placeholders keep the "this CV has an email / phone / profile link" signal the
// ATS checks rely on. Names and addresses are not redacted: they cannot be told
// apart from other text reliably and cover letters need the name.
//
// Opt-in via AI_REDACT_CONTACT=true so the effect on score quality can be
// compared before it is switched on in production.

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g
const URL_LIKE = /\b(?:https?:\/\/|www\.)[^\s)>,;]+|\b(?:linkedin\.com|github\.com|gitlab\.com|behance\.net)\/[^\s)>,;]+/gi
// +40 722 123 456, 0722.123.456, (021) 123 4567, 0040-722-123-456: 9+ digits with common separators.
const PHONE = /(?<![\w/])(?:\+|00)?\d(?:[\s.\-()]*\d){8,14}(?![\w/])/g

export function redactContactInfo(text: string): string {
  return text
    .replace(EMAIL, '[EMAIL]')
    .replace(URL_LIKE, '[LINK]')
    .replace(PHONE, '[PHONE]')
}

export function isContactRedactionEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.AI_REDACT_CONTACT === 'true'
}

export function maybeRedactContact(text: string): string {
  return isContactRedactionEnabled() ? redactContactInfo(text) : text
}
