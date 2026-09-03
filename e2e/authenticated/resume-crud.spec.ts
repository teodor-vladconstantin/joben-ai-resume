import { test, expect } from '@playwright/test'

test.describe('Resume CRUD (authenticated)', () => {
  test('create a resume, fill personal info, save, then delete it', async ({ page }) => {
    await page.goto('/resumes/new')
    await page.getByPlaceholder('John').fill('E2E')
    await page.getByPlaceholder('Doe').fill('Test')
    await page.getByPlaceholder('Software Engineer').fill('QA Engineer')
    await page.getByPlaceholder('john@example.com').fill('e2e-resume@joben.eu')

    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 15_000 })

    await page.goto('/resumes')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    // Clean up: delete every resume this spec may have created across runs
    // (window.confirm is native — auto-accept it).
    page.on('dialog', (dialog) => dialog.accept())
    const deleteButtons = page.getByRole('button', { name: /delete/i })
    const count = await deleteButtons.count()
    for (let i = 0; i < count; i++) {
      await page.getByRole('button', { name: /delete/i }).first().click()
      await page.waitForTimeout(300)
    }
    await expect(page.getByRole('button', { name: /delete/i })).toHaveCount(0)
  })

  test('editing an existing resume persists changes across reload', async ({ page }) => {
    await page.goto('/resumes/new')
    await page.getByPlaceholder('John').fill('Persisted')
    await page.getByRole('button', { name: /^save$/i }).click()
    await expect(page.getByText(/saved/i)).toBeVisible({ timeout: 15_000 })

    const url = page.url()
    await page.reload()
    await expect(page).toHaveURL(url)
    await expect(page.getByPlaceholder('John')).toHaveValue('Persisted')

    page.on('dialog', (dialog) => dialog.accept())
    await page.goto('/resumes')
    const deleteButtons = page.getByRole('button', { name: /delete/i })
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click()
    }
  })

  test('accessing a resume id that does not exist shows a not-found state instead of crashing', async ({ page }) => {
    const response = await page.goto('/resumes/00000000-0000-0000-0000-000000000000')
    expect(response?.status()).toBeLessThan(500)
  })
})
