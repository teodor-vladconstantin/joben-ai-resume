import { test, expect } from '@playwright/test'

test.describe('Marketing site (unauthenticated)', () => {
  test('landing page loads with hero, nav, and pricing sections', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/joben/i)
    await expect(page.getByRole('link', { name: /pricing/i }).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('pricing page renders all three plan cards with CTAs', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByText(/free/i).first()).toBeVisible()
    await expect(page.getByText(/pro/i).first()).toBeVisible()
    await expect(page.getByText(/recruiting/i).first()).toBeVisible()
  })

  test('free ATS checker page loads and accepts no file gracefully', async ({ page }) => {
    await page.goto('/free-ats-checker')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('resume examples page loads', async ({ page }) => {
    const response = await page.goto('/resume-examples')
    expect(response?.ok()).toBeTruthy()
  })

  test('nonexistent route returns a 404', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist-e2e')
    expect(response?.status()).toBe(404)
  })
})
