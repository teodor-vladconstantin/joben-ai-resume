import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'
import path from 'node:path'

// Layered like next dev's own env loading, but .env.test.local always wins
// for Clerk/Stripe so E2E never accidentally inherits .env.local's live
// keys. See .env.test.local.example for what to fill in.
dotenv.config({ path: path.resolve(__dirname, '.env.local') })
dotenv.config({ path: path.resolve(__dirname, '.env.test.local'), override: true })

for (const key of ['CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', 'STRIPE_SECRET_KEY']) {
  const value = process.env[key] ?? ''
  if (value.includes('_live_')) {
    throw new Error(
      `${key} is a LIVE key. E2E tests refuse to run against live Clerk/Stripe. ` +
        `Put test-mode keys in .env.test.local (see .env.test.local.example).`
    )
  }
}

const missing = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'E2E_TEST_USER_EMAIL',
  'E2E_TEST_USER_PASSWORD',
].filter((key) => !process.env[key])

if (missing.length > 0 && !process.env.CI) {
  console.warn(
    `[playwright.config] Missing from .env.test.local: ${missing.join(', ')}. ` +
      `Authenticated E2E specs will fail until these are set — see .env.test.local.example.`
  )
}

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'e2e/.report', open: 'never' }], ['list']],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'public',
      testMatch: /public\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'authenticated',
      testMatch: /authenticated\/.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: './e2e/.auth/user.json' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: process.env as Record<string, string>,
  },
})
