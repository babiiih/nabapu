import { chromium } from 'playwright';
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
console.log('tabs:', ctx.pages().map(p => p.url().slice(-45)));
const tab = await ctx.newPage();
await tab.goto(`chrome-extension://${extId}/home.html#/onboarding/unlock`);
await sleep(5000);

const cdp = await ctx.newCDPSession(tab);
const html = async () => (await cdp.send('DOM.getOuterHTML', { nodeId: (await cdp.send('DOM.getDocument', { depth: -1 })).root.nodeId })).outerHTML;
const errOf = (h) => (h.match(/help-text[^>]*>([^<]{3,90})</) || [])[1] || null;

const field = tab.locator('input[type="password"]').first();
if (!(await field.count())) { console.log('unlock form gak ada di tab ini'); await ctx.close(); process.exit(1); }

// metode 1: keyboard typing
await field.click();
await tab.keyboard.press('Control+A');
await tab.keyboard.type(PW, { delay: 60 });
await sleep(500);
await tab.locator('button', { hasText: /^Unlock$/i }).first().click();
await sleep(6000);
let H = await html();
console.log('setelah keyboard-type → url:', tab.url().split('#')[1], '| error:', errOf(H));

// kalau gagal → metode 2: fill() biasa
if (errOf(H)) {
  await field.fill('');
  await field.fill(PW);
  await sleep(400);
  await tab.locator('button', { hasText: /^Unlock$/i }).first().click();
  await sleep(6000);
  H = await html();
  console.log('setelah fill() → url:', tab.url().split('#')[1], '| error:', errOf(H));
}
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p12-unlock.png' });
console.log('tabs akhir:', ctx.pages().map(p => p.url().slice(-45)));
await ctx.close();
