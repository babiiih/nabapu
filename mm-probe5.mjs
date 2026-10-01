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
await sleep(5000);

const btnDump = async (tag) => {
  const n = await mm.locator('button').count();
  const arr = [];
  for (let i = 0; i < Math.min(n, 16); i++) {
    const b = mm.locator('button').nth(i);
    arr.push(`[${await b.getAttribute('data-testid') || '-'}]${(((await b.innerText()) || '').trim().replace(/\s+/g, ' ')).slice(0, 45)}`);
  }
  console.log(`\n[${tag}] ${JSON.stringify(arr)}`);
  await mm.screenshot({ path: `E:/tmp/ui-audit/poles/p5-${tag}.png` });
};
const tryClick = async (tid, regex) => {
  if (tid) { const b = mm.locator(`[data-testid="${tid}"]`); if (await b.count()) { try { await b.first().click({ timeout: 6000 }); return tid; } catch {} } }
  if (regex) { try { await mm.locator('button', { hasText: regex }).first().click({ timeout: 8000 }); return String(regex); } catch {} }
  return null;
};

await btnDump('start');
// resume: kalau masih di passkey
let r = await tryClick('passkey-maybe-later-button', /Maybe later/i);
console.log('→ passkey skip:', r);
await sleep(4000);
await btnDump('step-after-passkey');

// kalau ada secure/SRP reveal → Skip
r = await tryClick(undefined, /^Skip$/i);
console.log('→ skip srp:', r);
if (r) { await sleep(3000); await tryClick(undefined, /^Skip$/i); await sleep(3000); }
await btnDump('step-skip');

// completion / landing
r = await tryClick('onboarding-complete-done-button', /Got it|Done|All done|Continue|Start/i);
console.log('→ done:', r);
await sleep(4000);
await btnDump('final');

// cek wallet home (bukan onboarding lagi?)
await mm.goto(`chrome-extension://${extId}/home.html`);
await sleep(6000);
await btnDump('home');
try { console.log('home text:', (await mm.locator('body').innerText()).slice(0, 400).replace(/\n+/g, ' | ')); } catch {}
await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/p5-home.png' });
await ctx.close();
