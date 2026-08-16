// One-off reconciliation script for the 'cvs' Redis feature counter
// (features:{userId}:cvs). Run manually — NOT a cron job, not called from
// the app.
//
// Context: features:{userId}:cvs is a cumulative counter (no monthly reset,
// see src/lib/ratelimit.ts) that started at 0 for every user when CV-quota
// enforcement was wired up in src/app/api/resumes/route.ts. Users who
// already had resumes saved before that change went live are undercounted
// in Redis until this script seeds it with the real COUNT(*) from the
// `resumes` table.
//
// Usage:
//   node --env-file=.env.local scripts/reconcile-cvs-quota.mjs             # dry run (default, no writes)
//   node --env-file=.env.local scripts/reconcile-cvs-quota.mjs --execute   # writes the real count to Redis
//
// Equivalent via npm:
//   npm run reconcile:cvs-quota
//   npm run reconcile:cvs-quota -- --execute
//
// Requires in the environment: NEXT_PUBLIC_SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
// (all already in .env.local for local runs).
//
// Scope note: only users who currently have at least one row in `resumes`
// are touched (matches src/lib/ratelimit.ts's featureKey('cvs') scope: the
// counter only exists for users who created at least one resume). A user
// who deleted every resume they ever had and is now sitting on a stale
// nonzero Redis counter from before this fix is NOT covered by this script
// — they won't appear in the `resumes` scan at all. If that scenario turns
// out to matter, it needs a separate sweep over `users` instead.

import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

const EXECUTE = process.argv.includes('--execute')

// Keep in sync with src/lib/ratelimit.ts PLAN_LIMITS.cvs
const CVS_LIMIT_BY_PLAN = { free: 1, pro: 3, recruiting: 15 }

// Keep in sync with src/lib/plans.ts GOD_MODE_EMAILS
const GOD_MODE_EMAILS = new Set(['duku.constantin@gmail.com'])

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}

function normalizePlan(plan) {
  return plan === 'pro' || plan === 'recruiting' ? plan : 'free'
}

// Mirrors src/lib/plans.ts getUserPlan()'s resolution order: god-mode email
// override > lifetime_recruiting_unlocked > users.plan > 'free'.
function resolvePlan(userRow) {
  if (!userRow) return 'free'
  if (GOD_MODE_EMAILS.has(normalizeEmail(userRow.email))) return 'recruiting'
  if (userRow.lifetime_recruiting_unlocked) return 'recruiting'
  return normalizePlan(userRow.plan)
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in environment.')
    process.exit(1)
  }
  if (!redisUrl || !redisToken) {
    console.error('Missing UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN in environment.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const redis = new Redis({ url: redisUrl, token: redisToken })

  console.log(
    EXECUTE
      ? '=== EXECUTE MODE: will SET features:{userId}:cvs in Redis to the real resume count ==='
      : '=== DRY RUN: no writes will be made — pass --execute to apply these changes ==='
  )
  console.log('')

  // 1. Count real resumes per user_id, paginating (Supabase caps rows per request).
  const PAGE_SIZE = 1000
  const counts = new Map()
  let offset = 0
  for (;;) {
    const { data, error } = await supabase
      .from('resumes')
      .select('user_id')
      .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
      console.error('Failed to read resumes page:', error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break

    for (const row of data) {
      counts.set(row.user_id, (counts.get(row.user_id) || 0) + 1)
    }

    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }

  const userIds = [...counts.keys()]
  console.log(`Found ${userIds.length} distinct users with at least one resume.`)

  if (userIds.length === 0) {
    console.log('Nothing to reconcile.')
    return
  }

  // 2. Batch-fetch plan info for those users (chunked .in() calls).
  const CHUNK = 500
  const userRowsById = new Map()
  for (let i = 0; i < userIds.length; i += CHUNK) {
    const chunk = userIds.slice(i, i + CHUNK)
    const { data, error } = await supabase
      .from('users')
      .select('clerk_id, plan, email, lifetime_recruiting_unlocked')
      .in('clerk_id', chunk)

    if (error) {
      console.error('Failed to read users chunk:', error.message)
      process.exit(1)
    }
    for (const row of data || []) {
      userRowsById.set(row.clerk_id, row)
    }
  }

  // 3. Compare real count vs current Redis value, per user.
  let mismatches = 0
  let overLimit = 0
  const overLimitByPlan = { free: 0, pro: 0, recruiting: 0 }
  let missingUserRow = 0

  for (const userId of userIds) {
    const realCount = counts.get(userId)
    const userRow = userRowsById.get(userId)
    if (!userRow) missingUserRow++

    const plan = resolvePlan(userRow)
    const limit = CVS_LIMIT_BY_PLAN[plan]

    const key = `features:${userId}:cvs`
    const rawCached = await redis.get(key)
    const numericCached = Number(rawCached)
    const cachedCount = Number.isFinite(numericCached) ? Math.max(0, Math.floor(numericCached)) : 0

    const isAffected = realCount > limit
    if (isAffected) {
      overLimit++
      overLimitByPlan[plan] = (overLimitByPlan[plan] || 0) + 1
    }

    if (cachedCount !== realCount) {
      mismatches++
      const flag = isAffected ? '  [OVER PLAN LIMIT]' : ''
      console.log(`${userId}  plan=${plan} limit=${limit}  redis=${cachedCount} -> real=${realCount}${flag}`)

      if (EXECUTE) {
        await redis.set(key, realCount)
      }
    }
  }

  console.log('')
  console.log('=== Summary ===')
  console.log(`Users scanned (>=1 resume): ${userIds.length}`)
  console.log(
    `Users with a stale Redis counter: ${mismatches}${
      EXECUTE ? ' (corrected)' : ' (would be corrected with --execute)'
    }`
  )
  console.log(`Users currently over their plan's cvs limit: ${overLimit}`)
  console.log(`  free: ${overLimitByPlan.free}, pro: ${overLimitByPlan.pro}, recruiting: ${overLimitByPlan.recruiting}`)
  if (missingUserRow > 0) {
    console.log(`Users with resumes but no matching users row (treated as 'free'): ${missingUserRow}`)
  }
  if (!EXECUTE) {
    console.log('')
    console.log('Dry run only — re-run with --execute to write these values to Redis.')
  }
}

main().catch((error) => {
  console.error('Reconciliation script failed:', error)
  process.exit(1)
})
