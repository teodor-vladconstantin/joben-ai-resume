// One-off backfill: creates the missing `users` rows for Clerk users whose
// user.created webhook never arrived. Run manually, NOT a cron job.
//
// Context: until 2026-09-29 the production Clerk webhook pointed at
// https://www.joben.eu/api/webhooks/clerk, which answers 308 -> joben.eu.
// Clerk (Svix) does not follow redirects, so every user.created delivery
// failed and those sign-ups never got a `users` row.
//
// What it does, per Clerk user with no `users` row (matched by clerk_id):
//   inserts { clerk_id, email (primary, lowercased), first_name, last_name,
//   plan: 'free' }, the same fields the webhook upserts. It never updates an
//   existing row (ignoreDuplicates), sends no welcome email, captures no
//   PostHog event, and leaves tos_accepted_at empty: the consent token those
//   sign-ups carried is long expired, so there is no verifiable record to copy.
//
// Usage (needs the PRODUCTION Clerk key, sk_live_...; the local .env.local
// has a development key and the script refuses it):
//   vercel env pull .env.backfill --environment=production
//   node --env-file=.env.backfill scripts/backfill-clerk-users.mjs            # dry run (default, no writes)
//   node --env-file=.env.backfill scripts/backfill-clerk-users.mjs --execute  # inserts the missing rows
//   rm .env.backfill
//
// Requires: CLERK_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from '@supabase/supabase-js'

const execute = process.argv.includes('--execute')
const clerkKey = process.env.CLERK_SECRET_KEY || ''
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!clerkKey.startsWith('sk_live_')) {
  console.error('Refusing to run: CLERK_SECRET_KEY is not a production (sk_live_) key.')
  process.exit(1)
}
if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  process.exit(1)
}

// Only the domain is printed, so the output can be shared without exposing
// who signed up.
function maskEmail(email) {
  if (!email) return '(no email)'
  const [local, domain] = email.split('@')
  return `${local.slice(0, 2)}***@${domain}`
}

async function listClerkUsers() {
  const users = []
  for (let offset = 0; ; offset += 100) {
    const response = await fetch(`https://api.clerk.com/v1/users?limit=100&offset=${offset}&order_by=created_at`, {
      headers: { Authorization: `Bearer ${clerkKey}` },
    })
    if (!response.ok) throw new Error(`Clerk API ${response.status}: ${await response.text()}`)
    const page = await response.json()
    users.push(...page)
    if (page.length < 100) return users
  }
}

function primaryEmail(user) {
  const primary = user.email_addresses?.find((e) => e.id === user.primary_email_address_id) || user.email_addresses?.[0]
  const email = (primary?.email_address || '').trim().toLowerCase()
  return email || null
}

const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

const clerkUsers = await listClerkUsers()
const { data: rows, error } = await supabase.from('users').select('clerk_id')
if (error) throw new Error(`Supabase users select failed: ${error.message}`)
const existing = new Set((rows || []).map((row) => row.clerk_id))

const missing = clerkUsers.filter((user) => !existing.has(user.id))
console.log(`Clerk users: ${clerkUsers.length}, users rows: ${existing.size}, missing: ${missing.length}`)
for (const user of missing) {
  console.log(`  ${user.id}  ${maskEmail(primaryEmail(user))}  created ${new Date(user.created_at).toISOString()}`)
}

if (!execute) {
  console.log('\nDry run: nothing written. Re-run with --execute to insert the rows above.')
  process.exit(0)
}

const payload = missing.map((user) => ({
  clerk_id: user.id,
  email: primaryEmail(user),
  first_name: user.first_name,
  last_name: user.last_name,
  plan: 'free',
}))

if (payload.length > 0) {
  const { error: insertError } = await supabase
    .from('users')
    .upsert(payload, { onConflict: 'clerk_id', ignoreDuplicates: true })
  if (insertError) throw new Error(`Insert failed: ${insertError.message}`)
}

const { count } = await supabase.from('users').select('clerk_id', { count: 'exact', head: true })
console.log(`\nInserted up to ${payload.length} rows. users rows now: ${count}`)
