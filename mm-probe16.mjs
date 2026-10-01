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
await sleep(7000);
const cdp = await ctx.newCDPSession(tab);
const doc = await cdp.send('DOM.getDocument', { depth: -1 });
const H = (await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId })).outerHTML;
fs.writeFileSync('E:/tmp/mm-review2.html', H);
// teks bersih: buang style/script/keyframes
let t = H.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ');
t = t.replace(/<[^>]+>/g, '|').replace(/\s*\|\s*/g, ' | ').replace(/\|+/g, ' | ');
console.log('TEXT:', t.slice(0, 1500));
const btns = [];
const n = await tab.locator('button').count();
for (let i = 0; i < Math.min(n, 20); i++) {
  const b = tab.locator('button').nth(i);
  btns.push(`[${await b.getAttribute('data-testid') || '?'}]`);
}
console.log('BTN:', JSON.stringify(btns));
const ins = await tab.locator('input').count();
for (let i = 0; i < ins; i++) {
  const el = tab.locator('input').nth(i);
  console.log('INPUT:', await el.getAttribute('type'), await el.getAttribute('id'), await el.getAttribute('placeholder'));
}
console.log('url:', tab.url().slice(-60));
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p16-review.png' });
await ctx.close();
