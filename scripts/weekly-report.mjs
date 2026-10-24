// Raport de luni: rulează docs/growth/weekly-report.sql în PostHog și îl trimite pe email prin Resend.
// Env: POSTHOG_PERSONAL_API_KEY, RESEND_API_KEY, REPORT_EMAIL (opțional). Rulat de .github/workflows/weekly-report.yml.
import { readFileSync } from 'node:fs'

const POSTHOG_HOST = 'https://eu.posthog.com'
const PROJECT_ID = '163757'
const { POSTHOG_PERSONAL_API_KEY, RESEND_API_KEY } = process.env
const REPORT_EMAIL = process.env.REPORT_EMAIL || 'duku.constantin@gmail.com'
for (const [name, value] of Object.entries({ POSTHOG_PERSONAL_API_KEY, RESEND_API_KEY })) {
  if (!value) throw new Error(`${name} lipsește`)
}

const sql = readFileSync(new URL('../docs/growth/weekly-report.sql', import.meta.url), 'utf8')
  .replace(/--.*$/gm, '')
  .trim()

const queryRes = await fetch(`${POSTHOG_HOST}/api/projects/${PROJECT_ID}/query/`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${POSTHOG_PERSONAL_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: { kind: 'HogQLQuery', query: sql } }),
})
if (!queryRes.ok) throw new Error(`PostHog ${queryRes.status}: ${await queryRes.text()}`)
const { columns, results } = await queryRes.json()

// utm_content vine din URL-uri publice, deci se escapează înainte de HTML.
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const cell = 'style="padding:4px 10px;border:1px solid #ddd;text-align:left"'
const head = columns.map((c) => `<th ${cell}>${esc(c)}</th>`).join('')
const rows = results.map((r) => `<tr>${r.map((v) => `<td ${cell}>${esc(v)}</td>`).join('')}</tr>`).join('')
const total = (col) => results.reduce((n, r) => n + Number(r[columns.indexOf(col)] || 0), 0)
const summary = `Plăți: ${total('payments')}, checkout: ${total('checkouts')}, signup: ${total('signups')}, scanări: ${total('scans')}.`

const sendRes = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'Joben <no-reply@joben.eu>',
    to: REPORT_EMAIL,
    subject: `Joben, raport săptămânal pe sursă: ${total('payments')} plăți`,
    html: `<p>${esc(summary)}</p><table style="border-collapse:collapse;font:13px sans-serif"><tr>${head}</tr>${rows}</table>`,
  }),
})
if (!sendRes.ok) throw new Error(`Resend ${sendRes.status}: ${await sendRes.text()}`)
console.log('Raport trimis.', summary)
