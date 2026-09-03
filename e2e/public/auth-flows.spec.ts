import { test, expect } from '@playwright/test'
import { setupClerkTestingToken } from '@clerk/testing/playwright'

test.describe('Auth flows and edge cases (unauthenticated)', () => {
  test('visiting a protected route while signed out redirects to sign-in', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForURL(/\/sign-in/)
    await expect(page).toHaveURL(/\/sign-in/)
  })

  test('sign-up requires accepting the legal checkbox before Clerk form appears', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByText(/terms and conditions/i)).toBeVisible()

    await page.getByRole('button', { name: /continue to sign up/i }).click()
    await expect(page.getByText(/must accept the terms/i)).toBeVisible()

    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: /continue to sign up/i }).click()
    await expect(page.locator('.cl-rootBox, .cl-signUp-root').first()).toBeVisible({ timeout: 15_000 })
  })

  test('sign-in shows an error for a wrong password', async ({ page }) => {
    const email = process.env.E2E_TEST_USER_EMAIL
    test.skip(!email, 'E2E_TEST_USER_EMAIL not configured — see .env.test.local.example')

    await setupClerkTestingToken({ page })
    await page.goto('/sign-in')
    await page.getByRole('textbox', { name: /email address/i }).fill(email!)
    await page.getByRole('button', { name: /continue/i }).click()
    await page.getByRole('textbox', { name: /password/i }).fill('definitely-the-wrong-password-123')
    await page.getByRole('button', { name: /continue/i }).click()

    await expect(page.getByText(/incorrect|invalid|is not correct/i).first()).toBeVisible({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/sign-in/)
  })
})
