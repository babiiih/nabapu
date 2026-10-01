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
await mm.goto(`chrome-extension://${extId}/home.html#onboarding`);
await sleep(6000);

// LavaMoat blokir evaluate → pakai locator API saja (isolated world)
const dump = async (tag) => {
  let buttons = [], inputs = [], text = '';
  try { buttons = (await mm.locator('button').allInnerTexts()).map(t => t.trim().replace(/\s+/g, ' ')).filter(Boolean).slice(0, 25); } catch {}
  try {
    const n = await mm.locator('input, textarea').count();
    for (let i = 0; i < Math.min(n, 15); i++) {
      const el = mm.locator('input, textarea').nth(i);
      inputs.push(`${await el.getAttribute('type') || 'text'}:${(await el.getAttribute('placeholder')) || (await el.getAttribute('name')) || (await el.getAttribute('id')) || ''}`);
    }
  } catch {}
  try { text = (await mm.locator('body').innerText()).slice(0, 350).replace(/\n+/g, ' | '); } catch {}
  console.log(`\n[${tag}] buttons=${JSON.stringify(buttons)}\n  inputs=${JSON.stringify(inputs)}\n  text=${text}`);
  await mm.screenshot({ path: `E:/tmp/ui-audit/poles/probe-${tag}.png` });
};

await dump('start');
try {
  await mm.locator('button', { hasText: /Create a new wallet/i }).first().click({ timeout: 15000 });
  await sleep(3000);
  await dump('after-create');
} catch { console.log('(gak ada tombol Create)'); }
try { await mm.locator('button', { hasText: /^I agree$/i }).first().click({ timeout: 5000 }); await sleep(2000); } catch {}
try { await mm.locator('button', { hasText: /No thanks/i }).first().click({ timeout: 4000 }); await sleep(2000); } catch {}
await dump('pre-srp');
try {
  await mm.locator('button', { hasText: /Use Secret Recovery Phrase/i }).first().click({ timeout: 20000 });
  await sleep(5000);
  await dump('after-srp');
} catch (e) { console.log('SRP click gagal:', e.message.slice(0, 150)); await dump('srp-fail'); }
await ctx.close();
