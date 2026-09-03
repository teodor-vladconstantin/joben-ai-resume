import { test, expect } from '@playwright/test'

test.describe('Dashboard (authenticated)', () => {
  test('signed-in user lands on dashboard with sidebar nav', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.getByRole('link', { name: /resumes/i }).first()).toBeVisible()
    await expect(page.getByRole('link', { name: /cover letters/i }).first()).toBeVisible()
  })

  test('sidebar navigates to resumes, cover letters, and settings', async ({ page }) => {
    await page.goto('/dashboard')

    await page.getByRole('link', { name: /^resumes$/i }).first().click()
    await page.waitForURL(/\/resumes/)

    await page.getByRole('link', { name: /settings/i }).first().click()
    await page.waitForURL(/\/settings/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})
