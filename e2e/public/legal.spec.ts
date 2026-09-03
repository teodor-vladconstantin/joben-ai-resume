import { test, expect } from '@playwright/test'

test.describe('Legal pages', () => {
  for (const path of ['/terms', '/privacy', '/cookies']) {
    test(`${path} loads successfully`, async ({ page }) => {
      const response = await page.goto(path)
      expect(response?.ok()).toBeTruthy()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })
  }
})
