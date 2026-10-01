import { chromium } from 'playwright';
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
await tab.goto(`chrome-extension://${extId}/home.html`);
await sleep(9000);
console.log('url:', tab.url().slice(0, 100));
const cdp = await ctx.newCDPSession(tab);
const H = (await cdp.send('DOM.getOuterHTML', { nodeId: (await cdp.send('DOM.getDocument', { depth: -1 })).root.nodeId })).outerHTML;
const text = H.replace(/<[^>]+>/g, '|').replace(/\|+/g, ' | ');
console.log('teks:', text.slice(text.indexOf('MetaMask'), text.indexOf('MetaMask') + 400));
const btns = [];
const n = await tab.locator('button').count();
for (let i = 0; i < Math.min(n, 18); i++) { const b = tab.locator('button').nth(i); btns.push(`[${await b.getAttribute('data-testid') || (await b.getAttribute('aria-label')) || '?'}]`); }
console.log('buttons:', JSON.stringify(btns));
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p14-home.png' });
await ctx.close();
