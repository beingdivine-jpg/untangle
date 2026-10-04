import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('illustration follows motion preferences, can be paused, and stops outside the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const sculpture = page.locator('.editorial-hero')
  const current = page.locator('.editorial-image')
  await expect(sculpture).toHaveAttribute('data-motion', 'paused')
  await expect(current).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'Play illustration', exact: true }).click()
  await expect(sculpture).toHaveAttribute('data-motion', 'playing')
  await expect(current).toHaveCSS('animation-name', 'editorial-drift')
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).click()
  await expect(sculpture).toHaveAttribute('data-motion', 'paused')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  await expect(sculpture).toHaveAttribute('data-motion', 'playing')
  // Keyboard users can stop the decorative movement without changing any plan.
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(current).toHaveCSS('animation-play-state', 'paused')
  await page.getByRole('button', { name: 'Play illustration', exact: true }).click()
  await page.getByRole('button', { name: 'Start with my own situation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'What is on your mind?' })).toBeVisible()
  await expect(sculpture).toHaveAttribute('data-motion', 'paused')
})

test('English and Polish opening choices fit on small screens, with an accessible static view', async ({ page }) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const locale of ['en', 'pl']) {
    for (const width of [320, 390, 768, 1280]) {
      const height = width === 1280 ? 720 : 900
      await page.setViewportSize({ width, height })
      await page.goto(`/?lang=${locale}`)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('.editorial-image')).toBeVisible()
      for (const control of ['.u-intro-actions .u-primary', '.u-intro-actions .u-quiet', '.u-header .language-switch', '.u-exit']) {
        const box = await page.locator(control).boundingBox()
        expect(box, `${locale} ${width} ${control}`).not.toBeNull()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(width)
        expect(box!.y + box!.height).toBeLessThanOrEqual(height)
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([])
    }
  }
})


test('a chosen thread opens the matching setup without changing accounts or saving data', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Your location Maps/ }).click()
  await expect(page.locator('.chapter-preview')).toContainText('location-sharing settings')
  await expect(page.getByRole('link', { name: 'Leave this page', exact: true })).toBeInViewport()
  await page.getByRole('button', { name: 'Start here', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'What is on your mind?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Can someone see where I am?', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Who can get into my accounts?', exact: true })).toHaveAttribute('aria-pressed', 'false')
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0)
  await page.getByRole('button', { name: /Google, Gmail or Google Photos/ }).click()
  await page.getByRole('button', { name: 'Show my first step', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'See who can view your location in Google Maps', exact: true })).toBeVisible()
  await page.getByRole('banner').getByRole('button', { name: 'Back to introduction', exact: true }).click()
  await page.getByRole('button', { name: /Your accounts Old passwords/ }).click()
  await page.getByRole('button', { name: 'Start here', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Can someone see where I am?', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Who can get into my accounts?', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('starting choices and topic selection work if the photograph cannot load', async ({ page }) => {
  await page.route('**/art/untangle-editorial.jpg', route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Your life. Your terms.' })).toBeVisible()
  await page.getByRole('button', { name: /Your photos Shared albums/ }).click()
  await expect(page.locator('.chapter-preview')).toContainText('specialist help')
  await page.getByRole('button', { name: 'How it works', exact: true }).click()
  await expect(page.locator('#welcome-companion-details')).toContainText('scripted example')
  await page.getByRole('button', { name: 'Try Me', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Let.s follow the thread/ })).toBeVisible()
})
