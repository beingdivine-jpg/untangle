import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('illustration follows motion preferences, can be paused, and stops outside the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const portrait = page.locator('.living-portrait')
  const current = page.locator('.portrait-current')
  await expect(portrait).toHaveAttribute('data-motion', 'paused')
  await expect(current).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'Play illustration', exact: true }).click()
  await expect(portrait).toHaveAttribute('data-motion', 'playing')
  await expect(current).toHaveCSS('animation-name', 'strand-current')
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).click()
  await expect(portrait).toHaveAttribute('data-motion', 'paused')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.reload()
  await expect(portrait).toHaveAttribute('data-motion', 'playing')
  // Keyboard users can stop the decorative movement without changing any plan.
  await page.getByRole('button', { name: 'Pause illustration', exact: true }).focus()
  await page.keyboard.press('Enter')
  await expect(current).toHaveCSS('animation-play-state', 'paused')
  await page.getByRole('button', { name: 'Play illustration', exact: true }).click()
  await page.getByRole('button', { name: 'Start with my own situation', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'What is on your mind?' })).toBeVisible()
  await expect(portrait).toHaveAttribute('data-motion', 'paused')
})

test('English and Polish opening choices fit on small screens, with an accessible static view', async ({ page }) => {
  test.setTimeout(90000)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const locale of ['en', 'pl']) {
    for (const width of [320, 390, 768, 1280]) {
      const height = width === 1280 ? 800 : 900
      await page.setViewportSize({ width, height })
      await page.goto(`/?lang=${locale}`)
      await page.evaluate(() => document.fonts.ready)
      await expect(page.locator('.portrait-image')).toBeVisible()
      await expect.poll(() => page.locator('.portrait-image').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true)
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
