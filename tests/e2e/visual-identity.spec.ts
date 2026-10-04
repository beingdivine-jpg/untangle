import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('illustration follows motion preferences, can be paused, and stops outside the viewport', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const sculpture = page.locator('.thread-sculpture')
  const current = page.locator('.fallback-cords')
  await expect(sculpture).toHaveAttribute('data-motion', 'paused')
  await expect(current).toHaveCSS('animation-name', 'none')
  await page.getByRole('button', { name: 'Play illustration', exact: true }).click()
  await expect(sculpture).toHaveAttribute('data-motion', 'playing')
  await expect(current).toHaveCSS('animation-name', 'thread-float')
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
      await expect(page.getByRole('slider')).toBeVisible()
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


test('threads loosen by keyboard and remain usable when 3D is unavailable', async ({ page }) => {
  // Real capability failure: older devices must keep the same starting choices.
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
      value: function (kind: string, options?: unknown) {
        if (kind.includes('webgl')) return null
        return Reflect.apply(getContext, this, [kind, options])
      },
    })
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const sculpture = page.locator('.thread-sculpture')
  const drawing = page.locator('.fallback-cords path').first()
  await expect(sculpture).toHaveAttribute('data-renderer', 'vector')
  await expect(page.locator('.sculpture-fallback')).toHaveCSS('opacity', '1')
  const tangled = await drawing.getAttribute('d')
  const slider = page.getByRole('slider', { name: 'Loosen the illustrated threads' })
  await slider.press('End')
  await expect(slider).toHaveValue('100')
  await expect(slider).toHaveAttribute('aria-valuetext', 'Loosened')
  const loose = await drawing.getAttribute('d')
  expect(loose).not.toBe(tangled)
  await slider.press('ArrowLeft')
  await expect(drawing).not.toHaveAttribute('d', loose!)
  await slider.press('Home')
  await expect(drawing).toHaveAttribute('d', tangled!)
  await expect(slider).toHaveAttribute('aria-valuetext', 'Tangled')
  await page.getByRole('button', { name: 'Try Me', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Let.s follow the thread/ })).toBeVisible()
})
