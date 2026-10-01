import { chromium } from 'playwright';
import fs from 'fs';
const PW = 'NabuTest!2026x#';
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
const mmTabs = () => ctx.pages().filter((p) => p.url().includes(extId));
const route = (p) => p.url().split('#')[1] || '/';
const htmlOf = async (p) => {
  const cdp = await ctx.newCDPSession(p);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  await cdp.detach().catch(() => {});
  return outerHTML;
};

const main = await ctx.newPage();
await main.goto(`chrome-extension://${extId}/home.html`);
await sleep(7000);

// unlock kalau perlu
const unlock = mmTabs().find((p) => /unlock/.test(p.url()));
if (unlock) {
  const f = unlock.locator('input[type="password"]').first();
  await f.click(); await unlock.keyboard.type(PW, { delay: 50 }); await sleep(300);
  await unlock.locator('button:has-text("Unlock")').first().click();
  console.log('unlock →'); await sleep(7000);
}
// passkey skip
const pk = mmTabs().find((p) => /setup-passkey/.test(p.url()));
if (pk) { await pk.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 15000 }).catch(() => {}); console.log('passkey skip'); await sleep(8000); }

// review via-UI: tunggu + dump total
const review = mmTabs().find((p) => /review-recovery-phrase/.test(p.url()));
if (!review) { console.log('review gak ada. tabs:', mmTabs().map(route)); await ctx.close(); process.exit(0); }
console.log('review route OK — tunggu render 15s');
await sleep(15000);
const H = await htmlOf(review);
fs.writeFileSync('E:/tmp/mm-review-viaUI.html', H);
const text = H.replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, '|').replace(/\s*\|\s*/g, ' | ');
const i = text.indexOf('MetaMask');
console.log('TEKS:', text.slice(i, i + 700));
const n = await review.locator('input').count();
console.log('inputs:', n);
for (let k = 0; k < n; k++) {
  const el = review.locator('input').nth(k);
  console.log(' -', await el.getAttribute('type'), await el.getAttribute('id'), 'vis=' + await el.isVisible());
}
const bc = await review.locator('button').count();
for (let k = 0; k < bc; k++) {
  const b = review.locator('button').nth(k);
  console.log(' btn', await b.getAttribute('data-testid'), 'disabled=' + await b.isDisabled());
}
await review.screenshot({ path: 'E:/tmp/ui-audit/poles/p20-review.png' });
await ctx.close();
