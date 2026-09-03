import { createClerkClient } from '@clerk/backend'
import { createClient } from '@supabase/supabase-js'

// Best-effort cleanup so re-runs don't accumulate test users. Deliberately
// swallows errors — a failed teardown must not fail the test run, and
// global-setup's getUserList lookup makes re-creation idempotent anyway.
export default async function globalTeardown() {
  const email = process.env.E2E_TEST_USER_EMAIL
  if (!email || !process.env.CLERK_SECRET_KEY) return

  try {
    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
    const existing = await clerkClient.users.getUserList({ emailAddress: [email] })
    for (const user of existing.data) {
      await clerkClient.users.deleteUser(user.id)
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        await supabase.from('users').delete().eq('clerk_id', user.id)
      }
    }
  } catch (err) {
    console.warn('[e2e/global-teardown] cleanup failed (non-fatal):', err)
  }
}
