import { company } from '@/lib/content'

export type EmailLocale = 'ro' | 'en'

// Replaced by sendEmail with the unsubscribe link; transactional emails that
// skip sendEmail leave the marker out of the footer via `unsubscribe: false`.
export const UNSUBSCRIBE_MARKER = '<!--unsubscribe-->'

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const GREEN = '#2CB87A'
const INK = '#0A0A0A'
const MUTED = '#5C5C57'
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

const FOOTER_COPY: Record<EmailLocale, { terms: string; privacy: string; contact: string; rights: string; reg: string }> = {
  en: {
    terms: 'Terms & Conditions',
    privacy: 'Privacy Policy',
    contact: 'Contact',
    rights: 'All rights reserved.',
    reg: 'Tax ID (CUI)',
  },
  ro: {
    terms: 'Termeni și condiții',
    privacy: 'Politica de confidențialitate',
    contact: 'Contact',
    rights: 'Toate drepturile rezervate.',
    reg: 'CUI',
  },
}

export function escapeEmailHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;color:${INK};">${html}</p>`
}

export function emailList(itemsHtml: string[]): string {
  const items = itemsHtml.map((i) => `<li style="margin:0 0 8px 0;">${i}</li>`).join('')
  return `<ul style="margin:0 0 20px 0;padding:0 0 0 20px;font-size:16px;line-height:1.6;color:${INK};">${items}</ul>`
}

export function emailButton(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px 0;"><tr><td style="background:${GREEN};border-radius:8px;"><a href="${escapeEmailHtml(href)}" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;font-weight:700;color:${INK};text-decoration:none;">${label}</a></td></tr></table>`
}

// One shell for every Joben email: logo header, content card, legal footer
// (copyright, Terms, Privacy Policy, company identification). Table layout and
// inline styles only, because Outlook and Gmail strip most modern CSS.
export function emailLayout(input: {
  locale?: EmailLocale
  heading: string
  bodyHtml: string
  cta?: { href: string; label: string }
  note?: string
  preheader?: string
  unsubscribe?: boolean
}): string {
  const locale = input.locale ?? 'en'
  const t = FOOTER_COPY[locale]
  const year = new Date().getFullYear()
  const legalLink = (path: string, label: string) =>
    `<a href="${appUrl}/${locale}/${path}" style="color:${MUTED};text-decoration:underline;">${label}</a>`
  const preheader = input.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${input.preheader}</div>`
    : ''

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Joben</title></head>
<body style="margin:0;padding:0;background:#F4F4F2;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F4F2;">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;font-family:${FONT};">
    <tr><td style="background:#000000;border-radius:12px 12px 0 0;padding:20px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="vertical-align:middle;"><a href="${appUrl}/${locale}" style="text-decoration:none;"><img src="${appUrl}/jobeneu_logo.jpg" width="48" height="48" alt="Joben" style="display:block;border:0;"></a></td>
        <td style="vertical-align:middle;padding-left:12px;font-family:${FONT};font-size:22px;font-weight:700;color:#FFFFFF;letter-spacing:0.5px;">Joben</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:#FFFFFF;padding:36px 32px 20px 32px;border-left:1px solid #E4E4E0;border-right:1px solid #E4E4E0;">
      <h1 style="margin:0 0 20px 0;font-size:24px;line-height:1.3;font-weight:700;color:${INK};">${input.heading}</h1>
      ${input.bodyHtml}
      ${input.cta ? emailButton(input.cta.href, input.cta.label) : ''}
      ${input.note ? `<p style="margin:0 0 16px 0;font-size:13px;line-height:1.5;color:${MUTED};">${input.note}</p>` : ''}
    </td></tr>
    <tr><td style="background:#FFFFFF;border-left:1px solid #E4E4E0;border-right:1px solid #E4E4E0;padding:0 32px;"><div style="border-top:3px solid ${GREEN};font-size:0;line-height:0;height:0;">&nbsp;</div></td></tr>
    <tr><td style="background:#FAFAF8;border:1px solid #E4E4E0;border-top:0;border-radius:0 0 12px 12px;padding:24px 32px;font-size:12px;line-height:1.7;color:${MUTED};text-align:center;">
      <p style="margin:0 0 10px 0;">${legalLink('terms', t.terms)} &nbsp;&middot;&nbsp; ${legalLink('privacy', t.privacy)} &nbsp;&middot;&nbsp; <a href="mailto:${company.email}" style="color:${MUTED};text-decoration:underline;">${t.contact}</a></p>
      <p style="margin:0 0 10px 0;">&copy; ${year} ${company.legalName}. ${t.rights}<br>${t.reg} ${company.cui} &middot; ${company.regCom}<br>${escapeEmailHtml(company.address)}</p>
      ${input.unsubscribe === false ? '' : `<p style="margin:0;">${UNSUBSCRIBE_MARKER}</p>`}
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>`
}
