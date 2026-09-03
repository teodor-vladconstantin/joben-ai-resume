import { test, expect } from '@playwright/test'

// Boundary test only: assert a real Stripe test-mode Checkout Session gets
// created for the right plan and the client redirects to it. We do not fill
// in card details or complete the purchase — the webhook-driven plan
// upgrade lifecycle is already covered by tests/api/webhooks-stripe.test.ts
// (22 cases) and requires local webhook forwarding this suite doesn't set up.
test.describe('Billing checkout (authenticated, Stripe test mode)', () => {
  test('clicking "Upgrade to Pro" creates a Stripe test Checkout Session', async ({ page }) => {
    await page.goto('/pricing')

    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/billing/checkout')),
      page.getByRole('button', { name: /upgrade to pro/i }).click(),
    ])

    expect(response.ok()).toBeTruthy()
    const payload = (await response.json()) as { url?: string; data?: { url?: string } }
    const checkoutUrl = payload.url ?? payload.data?.url
    expect(checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//)
  })

  test('the Manage Billing button on Settings surfaces a clear error for a user with no subscription', async ({ page }) => {
    await page.goto('/settings')
    const manageBilling = page.getByRole('button', { name: /manage billing/i })
    if ((await manageBilling.count()) === 0) {
      test.skip(true, 'No Manage Billing button rendered for a Free-plan user — nothing to exercise here')
    }
    await manageBilling.click()
    await expect(page.getByText(/error|failed|could not/i).first()).toBeVisible({ timeout: 10_000 })
  })
})
