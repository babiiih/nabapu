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
    arr.push(`[${await b.getAttribute('data-testid') || '-'}]${(((await b.innerText()) || '').trim().replace(/\s+/g, ' ')).slice(0, 40)}`);
  }
  const inputs = [];
  const ic = await mm.locator('input').count();
  for (let i = 0; i < Math.min(ic, 14); i++) {
    const el = mm.locator('input').nth(i);
    inputs.push(`${await el.getAttribute('name') || await el.getAttribute('type') || '-'}`);
  }
  console.log(`\n[${tag}] btn=${JSON.stringify(arr)} in=${JSON.stringify(inputs)}`);
  await mm.screenshot({ path: `E:/tmp/ui-audit/poles/p3-${tag}.png` });
};
const clickBtn = async (regex, tid) => {
  if (tid) {
    const b = mm.locator(`[data-testid="${tid}"]`);
    if (await b.count()) { await b.first().click({ timeout: 8000 }); return `tid:${tid}`; }
  }
  const b = mm.locator('button', { hasText: regex }).first();
  await b.click({ timeout: 30000 });
  return `txt:${regex}`;
};

try { await mm.locator('button', { hasText: /Restart MetaMask/i }).first().click({ timeout: 8000 }); console.log('restart clicked'); await sleep(6000); } catch { console.log('(no restart)'); }
await btnDump('start');

// 1. welcome → create
try { console.log('→', await clickBtn(/Create a new wallet/i)); await sleep(3500); } catch { console.log('(no create btn)'); }
// 2. consent opsional
try { await clickBtn(/^I agree$/i); await sleep(2000); } catch {}
try { await clickBtn(/No thanks/i); await sleep(2000); } catch {}
await btnDump('step2');
// 3. gateway → SRP
try { console.log('→', await clickBtn(/Use Secret Recovery Phrase/i)); await sleep(4000); } catch { console.log('(no srp btn)'); }
await btnDump('step3-pw');
// 4. password
const pwNew = mm.locator('input[name="create-password-new"]');
if (await pwNew.count()) {
  await pwNew.fill('NabuTest!2026x#');
  await mm.locator('input[name="create-password-confirm"]').fill('NabuTest!2026x#');
  const t = mm.locator('input[name="create-password-terms"]');
  if (await t.count()) await t.check().catch(() => {});
  await sleep(600);
  await btnDump('step4-filled');
  // cari tombol submit apapun (enabled, bukan bahasa)
  let done = false;
  for (const tid of ['create-password-wallet', 'create-password-submit', 'create-password-continue', 'create-password-import', 'create-password-terms-error']) {
    const b = mm.locator(`[data-testid="${tid}"]`);
    if (await b.count() && (await b.isDisabled().catch(() => true)) === false) { await b.click({ timeout: 6000 }); console.log('submit:', tid); done = true; break; }
  }
  if (!done) {
    // fallback: button terakhir yang enabled & teksnya bukan bahasa
    const n = await mm.locator('button').count();
    for (let i = n - 1; i >= 0; i--) {
      const b = mm.locator('button').nth(i);
      const txt = ((await b.innerText().catch(() => '')) || '').trim();
      if (txt && !/[A-Za-z]{3}/.test(txt) === false && (await b.isDisabled().catch(() => true)) === false && txt.length < 45 && !/English|Español|Deutsch/.test(txt)) {
        try { await b.click({ timeout: 4000 }); console.log('submit fallback:', txt); done = true; break; } catch {}
      }
    }
  }
  await sleep(7000);
  await btnDump('step5-after-pw');
  try { console.log('text:', (await mm.locator('body').innerText()).slice(0, 250).replace(/\n+/g, ' | ')); } catch {}
} else {
  console.log('password form gak ada di step4');
}
await ctx.close();
