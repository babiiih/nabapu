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
console.log('ext:', extId);

// log semua event page baru
ctx.on('page', (p) => {
  console.log('  [new page]', p.url().slice(0, 120));
  p.on('framenavigated', (f) => { if (f === p.mainFrame()) console.log('  [nav]', p.url().slice(0, 120)); });
});

const page = await ctx.newPage();
await page.goto('https://nabapu.vercel.app/token/0x67e891ebe485fd76060befb105d6a28e2ab46be0', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('button:has-text("Connect wallet")', { timeout: 60000 });

// trigger connect + watcher pages 20 detik
await page.click('button:has-text("Connect wallet")');
await sleep(1500);
try { await page.locator('button, [role="menuitem"], [role="option"]', { hasText: 'Injected' }).first().click({ timeout: 6000 }); } catch { console.log('Injected gak ketemu'); }

for (let i = 0; i < 20; i++) {
  const urls = ctx.pages().map((p) => p.url().replace('chrome-extension://', 'EXT://').slice(0, 110));
  console.log(`t+${i}s pages:`, JSON.stringify(urls));
  // kalau ada page non-site yang buka → dump buttonnya
  const pop = ctx.pages().find((p) => p.url().includes(extId) && !/home\.html$|home\.html#/.test(p.url()));
  if (pop) {
    console.log('POPUP KETEMU:', pop.url().slice(0, 130));
    const n = await pop.locator('button').count();
    for (let j = 0; j < Math.min(n, 12); j++) {
      const b = pop.locator('button').nth(j);
      console.log('  btn:', await b.getAttribute('data-testid'), '|', ((await b.innerText()) || '').trim().slice(0, 40));
    }
    await pop.screenshot({ path: 'E:/tmp/ui-audit/poles/p6-popup.png' });
    break;
  }
  await sleep(1000);
}
await ctx.close();
