import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { root } from './build.mjs';

// Optional verification tool. Playwright is supplied by the development host,
// never bundled with the game and never required for its runtime/build.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const evidence = join(root, process.env.BROWSER_EVIDENCE_DIR || 'doc/evidence/project-start');
mkdirSync(evidence, { recursive: true });
const results = [];
const errors = [];
const failedResponses = [];
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:4178';
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
page.on('response', (response) => { if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`); });
async function check(name, action) { await action(); results.push(`${name}: PASS`); }
async function ready() { await page.waitForSelector('html[data-ready="true"]'); }
async function visible(selector) { assert.equal(await page.locator(selector).isVisible(), true, selector); }
async function noOverflow() {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'Horizontal overflow');
}

try {
  await check('B01 desktop root startup and layout (1280x900)', async () => {
    assert.equal((await page.goto(base + '/')).status(), 200);
    await ready();
    await visible('#explore-panel');
    assert.equal(await page.locator('#challenge-panel').isVisible(), false);
    await noOverflow();
  });
  await check('B02 click both mode explanations and preserve pressed state', async () => {
    await page.getByRole('button', { name: '02 挑战关卡' }).click();
    await visible('#challenge-panel');
    assert.equal(await page.locator('[data-mode="challenge"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#explore-panel').isVisible(), false);
    await page.screenshot({ path: join(evidence, 'desktop.png'), fullPage: true });
    await page.getByRole('button', { name: '01 自由探索' }).click();
    await visible('#explore-panel');
  });
  await check('B03 Enter and Space keyboard activation', async () => {
    await page.locator('[data-mode="challenge"]').focus();
    await page.keyboard.press('Enter');
    await visible('#challenge-panel');
    await page.locator('[data-mode="explore"]').focus();
    await page.keyboard.press('Space');
    await visible('#explore-panel');
  });
  await check('B04 mobile viewport switches both modes without overflow (320x740)', async () => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.getByRole('button', { name: '02 挑战关卡' }).click();
    await visible('#challenge-panel');
    await noOverflow();
    await page.screenshot({ path: join(evidence, 'mobile.png'), fullPage: true });
    await page.getByRole('button', { name: '01 自由探索' }).click();
    await visible('#explore-panel');
    await noOverflow();
  });
  await check('B05 hall-shaped subpath loads local resources and interaction', async () => {
    await page.setViewportSize({ width: 1280, height: 900 });
    assert.equal((await page.goto(base + '/assets/games/abelian-sandpile/')).status(), 200);
    await ready();
    await page.getByRole('button', { name: '02 挑战关卡' }).click();
    await visible('#challenge-panel');
    const resources = await page.evaluate(() => performance.getEntriesByType('resource').map((item) => item.name));
    assert.equal(resources.filter((url) => /\.(?:css|js)$/.test(url)).length, 3);
    for (const url of resources.filter((value) => /\.(?:css|js)$/.test(value))) assert.ok(url.includes('/assets/games/abelian-sandpile/'));
  });
  await check('B06 built file opens and switches modes while offline', async () => {
    await context.setOffline(true);
    await page.goto(pathToFileURL(join(root, 'dist/index.html')).href);
    await ready();
    await page.getByRole('button', { name: '02 挑战关卡' }).click();
    await visible('#challenge-panel');
    await noOverflow();
  });
  assert.deepEqual(errors, [], 'Browser errors');
  assert.deepEqual(failedResponses, [], 'HTTP failures');
  const report = [`Browser: ${browser.version()} (Chrome, headless, fresh context)`, ...results,
    `${results.length} passed; 0 failed; 0 page/console errors; 0 HTTP failures`,
    'Scope: project scaffold only; no gameplay, Android WebView or hall integration verified.',
  ].join('\n') + '\n';
  writeFileSync(join(evidence, 'browser.txt'), report);
  console.log(report);
} finally { await browser.close(); }
