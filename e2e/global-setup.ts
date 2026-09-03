import { chromium, type FullConfig } from '@playwright/test'
import { clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright'
import { createClerkClient } from '@clerk/backend'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

const AUTH_FILE = path.resolve(__dirname, '.auth/user.json')

// Mirrors the users.upsert() shape in src/app/api/webhooks/clerk/route.ts's
// user.created handler. E2E runs against local Supabase without a real
// webhook forwarder, so this seeds the row the webhook would otherwise
// create — authenticated specs (resume CRUD, dashboard) rely on it existing.
async function seedSupabaseUser(clerkId: string, email: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing — is local Supabase running?')
  }
  const supabase = createClient(url, serviceRoleKey)
  const { error } = await supabase.from('users').upsert(
    { clerk_id: clerkId, email, first_name: 'E2E', last_name: 'Test', plan: 'free' },
    { onConflict: 'clerk_id' }
  )
  if (error) throw new Error(`Failed to seed Supabase users row: ${error.message}`)
}

async function ensureClerkTestUser(email: string, password: string) {
  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })
  const existing = await clerkClient.users.getUserList({ emailAddress: [email] })
  if (existing.data.length > 0) {
    return existing.data[0]
  }
  return clerkClient.users.createUser({
    emailAddress: [email],
    password,
    skipPasswordChecks: true,
    skipPasswordRequirement: true,
    firstName: 'E2E',
    lastName: 'Test',
  })
}

export default async function globalSetup(config: FullConfig) {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  const email = process.env.E2E_TEST_USER_EMAIL
  const password = process.env.E2E_TEST_USER_PASSWORD
  const hasClerkCreds = !!process.env.CLERK_SECRET_KEY && !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!email || !password || !hasClerkCreds) {
    console.warn(
      '[e2e/global-setup] Missing Clerk test credentials or E2E_TEST_USER_EMAIL/PASSWORD — ' +
        'writing an empty auth state. Specs in e2e/authenticated/** will fail until ' +
        '.env.test.local is filled in (see .env.test.local.example).'
    )
    fs.writeFileSync(AUTH_FILE, JSON.stringify({ cookies: [], origins: [] }))
    return
  }

  await clerkSetup()
  const clerkUser = await ensureClerkTestUser(email, password)
  await seedSupabaseUser(clerkUser.id, email)

  const baseURL = config.projects[0]?.use?.baseURL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const browser = await chromium.launch()
  const page = await browser.newPage({ baseURL })
  await setupClerkTestingToken({ page })

  await page.goto('/sign-in')
  await page.getByRole('textbox', { name: /email address/i }).fill(email)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.getByRole('textbox', { name: /password/i }).fill(password)
  await page.getByRole('button', { name: /continue/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 })

  await page.context().storageState({ path: AUTH_FILE })
  await browser.close()
}
