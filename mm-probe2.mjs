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

const dumpBtns = async (tag) => {
  const n = await mm.locator('button').count();
  const arr = [];
  for (let i = 0; i < Math.min(n, 20); i++) {
    const b = mm.locator('button').nth(i);
    arr.push({
      tid: await b.getAttribute('data-testid'),
      txt: ((await b.innerText()) || '').trim().replace(/\s+/g, ' ').slice(0, 45),
      dis: await b.isDisabled().catch(() => '?'),
    });
  }
  console.log(`[${tag}]`, JSON.stringify(arr));
};

// tunggu form password muncul (resume onboarding)
try {
  await mm.locator('input[name="create-password-new"]').first().waitFor({ timeout: 90000 });
  console.log('✓ form password ada');
} catch {
  console.log('form password gak muncul — dump dulu');
  await dumpBtns('waiting');
  await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/probe-wait.png' });
  await ctx.close(); process.exit(1);
}

await mm.locator('input[name="create-password-new"]').fill('NabuTest!2026x#');
await mm.locator('input[name="create-password-confirm"]').fill('NabuTest!2026x#');
const terms = mm.locator('input[name="create-password-terms"]');
if (await terms.count()) await terms.check().catch(() => {});
await sleep(800);
await dumpBtns('password-filled');
await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/probe-pass.png' });

// submit: coba kandidat testid/teks
const submitCandidates = ['create-password-wallet', 'create-password-submit', 'create-password-continue', 'submit', 'create-password-import'];
let clicked = null;
for (const tid of submitCandidates) {
  const b = mm.locator(`[data-testid="${tid}"]`);
  if (await b.count()) { await b.click({ timeout: 5000 }).then(() => { clicked = tid; }).catch(() => {}); if (clicked) break; }
}
if (!clicked) {
  for (const t of ['Create a new wallet', 'Continue', 'Confirm', 'Next']) {
    const b = mm.locator('button', { hasText: new RegExp(`^\\s*${t}\\s*$`, 'i') }).first();
    try { await b.click({ timeout: 4000 }); clicked = t; break; } catch {}
  }
}
console.log('submit via:', clicked);
await sleep(6000);
await dumpBtns('after-submit');
try { console.log('text:', (await mm.locator('body').innerText()).slice(0, 300).replace(/\n+/g, ' | ')); } catch {}
await mm.screenshot({ path: 'E:/tmp/ui-audit/poles/probe-after-submit.png' });
await ctx.close();
