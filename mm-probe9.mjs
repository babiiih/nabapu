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
console.log('pages awal:', ctx.pages().map(p => p.url().slice(0, 80)));
if (!ctx.pages().some(p => p.url().includes(extId))) {
  const t = await ctx.newPage();
  await t.goto(`chrome-extension://${extId}/home.html`);
}
// tunggu form unlock di page mana pun
let mm = null;
for (let t = 0; t < 60 && !mm; t++) {
  for (const p of ctx.pages()) {
    if (!p.url().includes(extId)) continue;
    try { if (await p.locator('input[type="password"]').first().isVisible()) { mm = p; break; } } catch {}
  }
  if (!mm) await sleep(3000);
}
if (!mm) { console.log('unlock form gak ada — dump semua page'); for (const p of ctx.pages()) console.log('  ', p.url().slice(0, 90)); await ctx.close(); process.exit(1); }
console.log('unlock tab:', mm.url().slice(0, 90), '| total tabs:', ctx.pages().length);

const field = mm.locator('input[type="password"]').first();
await field.fill('NabuTest!2026x#');
const valLen = await field.inputValue().then(v => v.length).catch(() => '?');
console.log('terisi, len =', valLen);
await mm.locator('button', { hasText: /^Unlock$/i }).first().click();
console.log('Unlock diklik');
await sleep(9000);

// state setelah unlock
console.log('tabs:', ctx.pages().map(p => p.url().slice(0, 85)));
let anyPw = false;
for (const p of ctx.pages()) {
  if (!p.url().includes(extId)) continue;
  try {
    const n = await p.locator('input[type="password"]').count();
    const vis = n ? await p.locator('input[type="password"]').first().isVisible() : false;
    if (vis) anyPw = true;
    // coba baca error
    const errs = await p.locator('[class*="error"], [data-testid*="error"], .form-error, .mm-form__...').count().catch(() => 0);
    const errTxt = errs ? await p.locator('[class*="error"]').first().textContent().catch(() => null) : null;
    const btns = await p.locator('button').evaluateAll ? null : null;
    const aria = [];
    const bc = await p.locator('button').count();
    for (let i = 0; i < Math.min(bc, 14); i++) {
      const b = p.locator('button').nth(i);
      aria.push(`${await b.getAttribute('aria-label') || ''}|${(await b.getAttribute('data-testid')) || ''}`);
    }
    console.log(`tab ${p.url().slice(-25)}: pwVis=${vis} err=${JSON.stringify(errTxt)} btnAttrs=${JSON.stringify(aria)}`);
    await p.screenshot({ path: 'E:/tmp/ui-audit/poles/p9-after.png' });
  } catch (e) { console.log('tab read err:', e.message.slice(0, 80)); }
}
console.log('masih ada unlock form:', anyPw);
await ctx.close();
