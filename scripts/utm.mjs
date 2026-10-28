// Link cu UTM pentru o postare: node scripts/utm.mjs <sursa> <id-postare> [cale]
// ex: node scripts/utm.mjs reddit r-cv-feedback-01 /ro/verificare-cv-ats
// Convenție: utm_source = platforma, utm_medium = tipul, utm_content = id postare (unic, ales de tine).
const MEDIUM = { reddit: 'community', facebook: 'community', linkedin: 'social', ig: 'social', tiktok: 'social', dm: 'direct', uni: 'partner' }

const [source, content, path = '/ro/verificare-cv-ats'] = process.argv.slice(2)
if (!source || !content) {
  console.error('Folosire: node scripts/utm.mjs <sursa> <id-postare> [cale]')
  process.exit(1)
}
const url = new URL(path, 'https://joben.eu')
url.searchParams.set('utm_source', source)
url.searchParams.set('utm_medium', MEDIUM[source] ?? 'other')
url.searchParams.set('utm_campaign', 'wk-' + new Date().toISOString().slice(0, 10))
url.searchParams.set('utm_content', content)
console.log(url.toString())
