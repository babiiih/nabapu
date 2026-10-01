import { chromium } from 'playwright';
import fs from 'fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext('E:/cloak-browser/profiles/mmtest/user-data', {
  executablePath: 'E:/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  headless: false,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--load-extension=E:/cloak-browser/extensions/metamask', '--no-first-run'],
  viewport: { width: 1360, height: 920 },
});
let extId = null;
for (let i = 0; i < 20 && !extId; i++) {
  const sw = ctx.serviceWorkers().find((w) => w.url().includes('chrome-extension://'));
  if (sw) extId = new URL(sw.url()).host; else await sleep(1000);
}
const tab = await ctx.newPage();
await tab.goto(`chrome-extension://${extId}/home.html#/onboarding/review-recovery-phrase`);
await sleep(8000);
const cdp = await ctx.newCDPSession(tab);
const doc = await cdp.send('DOM.getDocument', { depth: -1 });
const H = (await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId })).outerHTML;
fs.writeFileSync('E:/tmp/mm-review-full.html', H);
const text = H.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '|').replace(/\s*\|\s*/g, ' | ');
const idx = text.indexOf('Back up');
console.log('TEKS INTI:', text.slice(idx >= 0 ? idx : 0, (idx >= 0 ? idx : 0) + 500));
// semua input utuh
const n = await tab.locator('input').count();
console.log('inputs:', n);
for (let i = 0; i < n; i++) {
  const el = tab.locator('input').nth(i);
  console.log(` - type=${await el.getAttribute('type')} id=${await el.getAttribute('id')} ph=${await el.getAttribute('placeholder')} testid=${await el.getAttribute('data-testid')} vis=${await el.isVisible()}`);
}
// checkbox?
const cbs = await tab.locator('input[type="checkbox"]').count();
console.log('checkbox:', cbs);
// apakah ada field password di screen ini?
const pw = await tab.locator('input[type="password"]').count();
console.log('password field:', pw);
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p19-review.png' });
await ctx.close();
