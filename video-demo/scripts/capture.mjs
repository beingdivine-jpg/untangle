/* global process, console, URL, document */
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const out = resolve(root, 'assets/captures');
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
const errors = [], requests = [], shots = {};
page.on('pageerror', error => errors.push(error.message));
page.on('request', request => { if (request.method() === 'POST' || !['localhost', '127.0.0.1'].includes(new URL(request.url()).hostname)) requests.push(request.url()); });
const url = process.env.APP_URL || 'http://127.0.0.1:5173';
async function shot(name, selector) {
  const target = page.locator(selector).filter({ visible: true }).first();
  await target.waitFor();
  await page.evaluate(() => document.fonts.ready);
  await target.screenshot({ path: resolve(out, `${name}.png`), animations: 'disabled' });
  const box = await target.boundingBox();
  const controls = [];
  for (const button of await target.getByRole('button').all()) {
    const b = await button.boundingBox();
    if (b) controls.push({ label: (await button.innerText()).trim(), x: b.x-box.x+b.width/2, y:b.y-box.y+b.height/2 });
  }
  shots[name] = { selector, width: box.width, height: box.height, controls, text: (await target.innerText()).trim() };
}
try {
  await page.goto(url);
  await shot('home', '.u-intro');
  await page.getByRole('button', { name: 'Try Me', exact: true }).click();
  await page.getByRole('button', { name: 'We shared a laptop.', exact: true }).click();
  await shot('story-picker', '.u-story-picker');
  await shot('facts', '.u-fact-note');
  await shot('start', '.u-working-panel');
  await page.locator('.u-working-panel').getByRole('button', { name: 'Connect the dots', exact: true }).click();
  assert.equal(await page.locator('.u-draft-list input').count(), 6);
  await shot('draft', '.u-draft-list');
  await shot('keep-button', '.u-working-panel .u-panel-actions');
  await shot('graph', '.u-canvas .thread-scene');
  await shot('trace', '.u-trace');
  await page.getByRole('button', { name: 'Keep these steps', exact: true }).click();
  await shot('kept', '.u-kept');
  await page.getByRole('navigation', { name: 'Assistant tools' }).getByRole('button', { name: 'What if I change…', exact: true }).click();
  await page.getByLabel('A change I’m considering').selectOption('password');
  await shot('change-select', '#what-if');
  await shot('effect', '.u-effect:not(.unchanged)');
  await shot('boundary', '.u-effect.unchanged');
  await shot('preparation', '.u-before');
  await shot('source', '.u-source');
  await page.getByRole('navigation', { name: 'Assistant tools' }).getByRole('button', { name: 'Connect the dots', exact: true }).click();
  await page.getByRole('button', { name: 'Open my full plan', exact: true }).click();
  await page.locator('.p-plan-overview').waitFor();
  assert.match(await page.locator('.p-progress-count').innerText(), /0\s*\/\s*6/);
  await shot('plan', '.p-plan-overview');
  await shot('plan-list', '.p-task-list');
  await page.getByRole('button', { name: /Look at devices using your Google account Google/ }).click();
  await page.getByRole('button', { name: /My update/ }).click();
  await shot('outcomes-unselected', '.p-outcomes');
  await page.getByRole('button', { name: 'I’m not sure what I found', exact: true }).click();
  await page.getByLabel('A reminder for yourself').fill('I still have a question about the shared laptop.');
  await shot('outcomes', '.p-outcomes');
  await shot('note', '#task-note');
  await page.getByRole('button', { name: 'Keep this update', exact: true }).click();
  await shot('question-row', '.p-row-group:has-text("Look at devices using your Google account")');
  assert.match(await page.locator('.p-progress-count').innerText(), /0\s*\/\s*6/);
  const nav = page.getByRole('navigation', { name: 'Plan navigation' });
  await nav.getByRole('button', { name: 'Review together', exact: true }).click();
  await shot('together', '.p-handoff-list');
  assert.equal(await page.getByLabel('Show my notes here').isChecked(), false);
  await nav.getByRole('button', { name: 'Save & resume', exact: true }).click();
  await page.getByLabel('Create a file passphrase', { exact: true }).fill('fictional demo phrase only');
  await page.getByLabel('Repeat the file passphrase', { exact: true }).fill('fictional demo phrase only');
  await shot('save', '.p-save-grid .p-form');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download private plan', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(download.suggestedFilename(), 'my-plan.untangle');
  // The fictional encrypted file is verified, then left in Playwright's temporary storage.
  const { readFile } = await import('node:fs/promises');
  const encrypted = await readFile(await download.path(), 'utf8');
  assert.equal(JSON.parse(encrypted).cipher, 'AES-GCM');
  assert.equal(encrypted.includes('shared laptop'), false);
  assert.equal(encrypted.includes('fictional demo phrase only'), false);
  await shot('download-confirmation', '.save-rehearsal');
  assert.deepEqual(errors, []);
  assert.deepEqual(requests, []);
  await writeFile(resolve(out, 'manifest.json'), JSON.stringify({ viewport: { width: 1440, height: 1100, scale: 2 }, fictional: true, workflowVerified: true, liveProviderCalls: 0, reviewedChecksAfterQuestion: 0, encryptedDownloadVerified: true, errors, shots }, null, 2) + '\n');
  console.log(`Captured ${Object.keys(shots).length} real UI regions; six checks, unanswered question, and encrypted download verified.`);
} finally { await browser.close(); }
