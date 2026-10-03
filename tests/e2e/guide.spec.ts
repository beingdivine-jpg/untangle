import { test, expect, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import fs from 'node:fs'

async function start(page: Page, example = false) {
  await page.goto('/?view=walkthrough')
  await page.getByRole('button', { name: example ? 'Try without using my account' : 'Help me take the first step' }).click()
  await page.getByRole('button', { name: example ? 'Show me the example' : 'Show me where to look', exact: true }).click()
}
async function devices(page: Page, example = false) {
  await page.getByRole('button', { name: example ? 'I can see the example list' : 'I can see my device list', exact: true }).click()
}
async function screenshot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `docs/screenshots/${name}.png`, fullPage: true, animations: 'disabled' })
}

test('short guide helps find the answer before asking; opening Google preserves progress', async ({ page, context }) => {
  await start(page)
  await expect(page.locator('#step-heading')).toBeFocused()
  await expect(page.getByText('Main account', { exact: true })).toHaveCount(0)
  await context.route('https://www.google.com/devices', route => route.fulfill({ contentType: 'text/html', body: '<h1>Test device list</h1>' }))
  const popupPromise = page.waitForEvent('popup')
  await page.getByRole('link', { name: /Open Google’s device list/ }).click()
  const popup = await popupPromise
  await expect(popup.getByRole('heading')).toHaveText('Test device list')
  await expect(page.locator('#step-heading')).toHaveText('Open Google’s device list.')
  await popup.close()
  await devices(page)
  await page.getByRole('button', { name: 'I found a device we used together' }).click()
  await page.getByRole('button', { name: 'It says “Signed out”', exact: true }).click()
  await expect(page.locator('#step-heading')).toHaveText('That entry says “Signed out”.')
  await expect(page.locator('.guide-lead')).toContainText('doesn’t tell us about other devices')
  await page.getByRole('button', { name: 'That’s enough for now' }).click()
  await expect(page.locator('#hero-title')).toBeFocused()
  await expect(page.locator('.guide-shell')).toHaveCount(0)
})

test('unknown, missing and paused paths give one next step without claiming safety', async ({ page }) => {
  await start(page)
  await devices(page)
  await page.getByRole('button', { name: 'I don’t see one', exact: true }).click()
  await expect(page.locator('.guide-lead')).toContainText('doesn’t tell us whether all access has ended')
  await page.getByRole('button', { name: 'Go back to the device check' }).click()
  await page.getByRole('button', { name: 'I can’t tell which device is which' }).click()
  await expect(page.locator('#step-heading')).toHaveText('You don’t have to guess.')
  await expect(page.locator('.one-next-thing')).toHaveCount(1)
  await expect(page.locator('.guide-shell .check-list')).toHaveCount(0)
  await page.getByRole('button', { name: 'That’s enough for now' }).click()
  await page.getByRole('button', { name: 'Help me take the first step' }).click()
  await page.getByRole('button', { name: 'I don’t feel comfortable checking' }).click()
  await expect(page.locator('#step-heading')).toHaveText('You can leave this for now.')
  await expect(page.getByRole('link', { name: /Open Google’s device list/ })).toHaveCount(0)
})

test('getting stuck offers practice; practice never connects to Google and stays visibly fictional', async ({ page }) => {
  await start(page)
  await page.getByRole('button', { name: 'I’m stuck', exact: true }).click()
  await page.getByRole('button', { name: 'Use the made-up example' }).click()
  await page.getByRole('button', { name: 'Show me the example' }).click()
  await expect(page.locator('.guide-toolbar')).toContainText('Practice · made up')
  await expect(page.getByRole('link', { name: /Open Google’s device list/ })).toHaveCount(0)
  await devices(page, true)
  await page.getByRole('button', { name: 'Look at the shared laptop' }).click()
  await expect(page.getByRole('button', { name: 'It says “Signed out”', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Explain this example', exact: true }).click()
  await expect(page.locator('#step-heading')).toHaveText('This entry may still be signed in.')
  await expect(page.locator('.practice-result')).toContainText('only the made-up example')
  await page.getByText('What would signing out do?', { exact: true }).click()
  await expect(page.locator('.guide-detail[open]')).toContainText('Other entries can stay signed in')
  await expect(page.locator('.guide-detail[open]')).toContainText('does not remove copies')
  await page.getByText('Read this with someone I trust', { exact: true }).click()
  await expect(page.getByText('This is a fictional practice example.')).toBeVisible()
  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0])
  await page.reload()
  await expect(page.locator('#hero-title')).toBeVisible()
  await expect(page.locator('.guide-shell')).toHaveCount(0)
})

test('Google recognition offers a useful alternative and help preserves the short guide', async ({ page }) => {
  await page.goto('/?view=walkthrough')
  await page.getByRole('button', { name: 'Help me take the first step' }).click()
  await page.getByRole('button', { name: 'I don’t know if I use Google' }).click()
  await expect(page.locator('.familiar-apps')).toContainText('Gmail')
  await page.getByRole('button', { name: 'Help & words' }).click()
  await expect(page.locator('#step-heading')).not.toBeVisible()
  await page.getByRole('button', { name: 'Back to my check' }).click()
  await expect(page.locator('#step-heading')).toHaveText('Do either of these look familiar?')
  await page.getByRole('button', { name: 'I’m not sure — show me an example' }).click()
  await expect(page.locator('.guide-toolbar')).toContainText('Practice · made up')
})

test('short guide is readable at phone and desktop widths, with accessible steps and visible first action', async ({ page }) => {
  test.setTimeout(60000)
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/?view=walkthrough')
    const begin = page.getByRole('button', { name: 'Help me take the first step' })
    const box = await begin.boundingBox()
    expect(box!.y + box!.height).toBeLessThanOrEqual(900)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1440 || width === 390) await screenshot(page, width === 1440 ? 'home' : 'home-mobile')
    await start(page, true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1440 || width === 390) await screenshot(page, width === 1440 ? 'guide' : 'guide-mobile')
    await devices(page, true)
    await page.getByRole('button', { name: 'Look at the shared laptop' }).click()
    await page.getByRole('button', { name: 'Explain this example', exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 1440 || width === 390) await screenshot(page, width === 1440 ? 'guide-result' : 'guide-result-mobile')
  }
  const results = []
  for (const view of ['result', 'home', 'ready', 'open', 'find', 'read'] as const) {
    if (view === 'home') await page.goto('/?view=walkthrough')
    if (view === 'ready') await page.getByRole('button', { name: 'Help me take the first step' }).click()
    if (view === 'open') await page.getByRole('button', { name: 'Show me where to look', exact: true }).click()
    if (view === 'find') await devices(page)
    if (view === 'read') await page.getByRole('button', { name: 'I found a device we used together' }).click()
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    expect(audit.violations).toEqual([])
    results.push({ view, violations: audit.violations.length })
  }
  fs.writeFileSync('docs/guide-accessibility-audit.json', JSON.stringify({ checked: '2026-10-03', engine: 'axe-core', results }, null, 2))
})
