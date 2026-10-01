import { chromium } from 'playwright';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ctx = await chromium.launchPersistentContext('E:/cloak-browser/profiles/mmtest/user-data', {
  executablePath: 'E:/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  headless: false,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--load-extension=E:/cloak-browser/extensions/metamask', '--no-first-run', '--disable-popup-blocking'],
  viewport: { width: 1360, height: 920 },
});
let extId = null;
for (let i = 0; i < 20 && !extId; i++) {
  const sw = ctx.serviceWorkers().find((w) => w.url().includes('chrome-extension://'));
  if (sw) extId = new URL(sw.url()).host; else await sleep(1000);
}
const page = await ctx.newPage();
await page.goto('https://nabapu.vercel.app/token/0x67e891ebe485fd76060befb105d6a28e2ab46be0', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('button:has-text("Connect wallet")', { timeout: 60000 });

// fire eth_requestAccounts tanpa await
page.evaluate(() => window.ethereum.request({ method: 'eth_requestAccounts' }).catch((e) => console.log('req err', e.message))).catch(() => {});
await sleep(6000);

const cdp = await ctx.newCDPSession(page);
try {
  const t = await cdp.send('Target.getTargets');
  for (const x of t.targetInfos) {
    console.log(`${x.type} | ${x.targetId.slice(0, 8)} | ${x.url.slice(0, 100)}`);
  }
} catch (e) { console.log('getTargets err:', e.message.slice(0, 120)); }
console.log('--- pages:', ctx.pages().length);
await ctx.close();
