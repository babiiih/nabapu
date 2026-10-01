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
const mm = await ctx.newPage();
await mm.goto(`chrome-extension://${extId}/home.html`);

for (let t = 0; t <= 210; t += 5) {
  const n = await mm.locator('input[type="password"]').count();
  let vis = false, box = null, type = null;
  if (n) {
    const el = mm.locator('input[type="password"]').first();
    vis = await el.isVisible().catch(() => false);
    box = await el.boundingBox().catch(() => null);
    type = await el.getAttribute('type');
  }
  const nAll = await mm.locator('input').count();
  console.log(`t=${t}s inputsAll=${nAll} pw=${n} visible=${vis} type=${type} box=${box ? Math.round(box.width) + 'x' + Math.round(box.height) : '-'}`);
  if (vis) { console.log('→ KETEMU VISIBLE'); break; }
  await sleep(5000);
}
await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/p8-poll.png' });
await ctx.close();
