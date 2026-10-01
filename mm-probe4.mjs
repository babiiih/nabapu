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
  try { console.log(`  text: ${(await mm.locator('body').innerText()).slice(0, 280).replace(/\n+/g, ' | ')}`); } catch {}
  await mm.screenshot({ path: `E:/tmp/ui-audit/poles/p4-${tag}.png` });
};
const clickBtn = async (regex, tid, t = 30000) => {
  if (tid) { const b = mm.locator(`[data-testid="${tid}"]`); if (await b.count()) { await b.first().click({ timeout: 8000 }); return `tid:${tid}`; } }
  await mm.locator('button', { hasText: regex }).first().click({ timeout: t });
  return `txt:${regex}`;
};

await btnDump('start');
// lewati kalau onboarding resume di tengah
try { await clickBtn(/Create a new wallet/i); await sleep(3000); console.log('→ create'); } catch {}
try { await clickBtn(/Use Secret Recovery Phrase/i); await sleep(4000); console.log('→ srp'); } catch {}

// password: input[type=password]
const pwds = mm.locator('input[type="password"]');
try {
  await pwds.nth(0).waitFor({ timeout: 40000 });
  await pwds.nth(0).fill('NabuTest!2026x#');
  if (await pwds.count() > 1) await pwds.nth(1).fill('NabuTest!2026x#');
  const cb = mm.locator('input[type="checkbox"]').first();
  if (await cb.count()) await cb.check().catch(() => {});
  await sleep(700);
  console.log('password terisi');
  console.log('→', await clickBtn(/Create password/i, 'create-password-submit', 45000));
  await sleep(8000);
  await btnDump('after-password');
} catch (e) {
  console.log('password stage gagal:', e.message.slice(0, 150));
  await btnDump('pw-fail');
}

// kalau muncul halaman secure/SRP reveal → cari Skip
try {
  await clickBtn(/^Skip$/i, undefined, 20000);
  await sleep(2500);
  console.log('→ skip SRP');
  await btnDump('after-skip');
  // modal konfirmasi skip
  try { await clickBtn(/^Skip$/i, undefined, 8000); await sleep(2500); await btnDump('after-skip2'); } catch {}
} catch { console.log('(no skip — mungkin tahap lain)'); }

// completion
try { await clickBtn(/Got it|Done|All done|Continue/i, undefined, 15000); await sleep(3000); console.log('→ done'); } catch {}
await btnDump('final');
await ctx.close();
