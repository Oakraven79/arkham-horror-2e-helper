import { expect, test } from '@playwright/test'

test.describe('standalone dashboard', () => {
  test('keeps the ordinary game entry point available without a phone', async ({ page }) => {
    await page.goto('/')

    if (page.url().includes('/sessions')) {
      await expect(page.getByRole('heading', { name: 'Game sessions' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Create session' })).toBeVisible()
      return
    }

    await expect(page.getByText('Mobile controls', { exact: true })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Turn phase' })).toBeVisible()
  })
})

test.describe('mobile controller', () => {
  test.use({
    viewport: {
      height: 844,
      width: 390,
    },
  })

  test('offers a compact join screen without requiring the dashboard', async ({ page }) => {
    await page.goto('/controller')

    await expect(page.getByRole('heading', { name: 'Join the table' })).toBeVisible()
    await expect(page.getByLabel('Your name')).toBeVisible()
    await expect(page.getByLabel('Join code')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Join controller' })).toBeVisible()

    const horizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    )
    expect(horizontalOverflow).toBe(false)
  })
})
