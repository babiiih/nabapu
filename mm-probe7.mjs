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
console.log('pages awal:', ctx.pages().map(p => p.url().slice(0, 90)));

const mm = await ctx.newPage();
await mm.goto(`chrome-extension://${extId}/home.html`);
await sleep(12000);
console.log('mm url:', mm.url().slice(0, 100));
console.log('frames:', mm.frames().map(f => f.url().slice(0, 100)));
for (const f of mm.frames()) {
  try {
    const inputs = await f.locator('input').count();
    const pws = await f.locator('input[type="password"]').count();
    const ph = inputs ? await f.locator('input').first().getAttribute('placeholder') : null;
    const btns = (await f.locator('button').allInnerTexts()).map(t => t.trim()).filter(Boolean).slice(0, 10);
    console.log(`frame[${f.url().slice(0, 60) || 'main'}]: inputs=${inputs} pws=${pws} ph=${ph} btns=${JSON.stringify(btns)}`);
  } catch (e) { console.log('frame err:', e.message.slice(0, 80)); }
}
// cek semua page termasuk yang kebuka otomatis
console.log('semua pages:', ctx.pages().map(p => p.url().slice(0, 100)));
await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/p7-struct.png' });
await ctx.close();
