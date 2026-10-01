import { chromium } from 'playwright';
import fs from 'fs';

const PW = 'NabuTest!2026x#';
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
async function htmlOf(p) {
  const cdp = await ctx.newCDPSession(p);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  await cdp.detach().catch(() => {});
  return outerHTML;
}
const mmTabs = () => ctx.pages().filter((p) => p.url().includes(extId));
const route = (p) => p.url().split('#')[1] || '/';
const findR = (rx) => mmTabs().find((p) => rx.test(p.url()));
const dump = () => console.log('tabs:', mmTabs().map(route));
let words = [];

const main = await ctx.newPage();
await main.goto(`chrome-extension://${extId}/home.html`);
await sleep(6000);
dump();

for (let round = 0; round < 22; round++) {
  // HOME = ada tab ext non-onboarding DAN gak ada satupun tab onboarding
  const onb = mmTabs().filter((p) => /#\/onboarding|unlock/i.test(p.url()));
  const homeTabs = mmTabs().filter((p) => !/#\/onboarding|unlock/i.test(p.url()));
  if (homeTabs.length && !onb.length) {
    // konfirmasi stabil: cek 3x berturut (hindari race '/' sesaat sebelum redirect)
    let stable = true;
    for (let k = 0; k < 3; k++) {
      await sleep(3000);
      const o2 = mmTabs().filter((p) => /#\/onboarding|unlock/i.test(p.url()));
      if (o2.length) { stable = false; console.log('home gak stabil — ada', o2.map(route)); break; }
    }
    if (stable) { console.log('🎉 HOME stabil:', homeTabs.map(route)); break; }
    continue;
  }

  const unlock = findR(/unlock/);
  const passkey = findR(/setup-passkey/);
  const review = findR(/review-recovery-phrase/);
  const reveal = findR(/reveal-recovery-phrase/);
  const confirm = findR(/confirm-recovery-phrase/);

  if (unlock) {
    const f = unlock.locator('input[type="password"]').first();
    if (!(await f.count())) { await sleep(4000); continue; }
    await f.click(); await unlock.keyboard.type(PW, { delay: 50 }); await sleep(300);
    await unlock.locator('button:has-text("Unlock")').first().click();
    console.log('→ unlock'); await sleep(6000); dump(); continue;
  }
  if (passkey) {
    await passkey.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 15000 });
    console.log('→ passkey skip'); await sleep(7000); dump(); continue;
  }
  if (review) {
    // layar ini = "Enter password to continue" (account-details-authenticate) — render agak lambat
    let f = review.locator('input[type="password"]').first();
    let got = false;
    for (let k = 0; k < 12 && !got; k++) {
      if ((await f.count()) && (await f.isVisible())) got = true;
      else await sleep(3000);
    }
    if (got) {
      await f.click(); await review.keyboard.type(PW, { delay: 50 }); await sleep(500);
      console.log('review: password diketik');
      await review.locator('[data-testid="recovery-phrase-continue"]').click({ timeout: 15000 });
      console.log('→ recovery-phrase-continue diklik');
      await sleep(8000);
      const Hr = await htmlOf(review);
      fs.writeFileSync('E:/tmp/mm-review4.html', Hr);
      const re = /<li[^>]*>\s*(?:<[^>]+>\s*)*([a-z]{3,12})\s*(?:<[^>]+>\s*)*<\/li>/gi;
      let m; const got2 = [];
      while ((m = re.exec(Hr)) && got2.length < 30) got2.push(m[1]);
      if (got2.length >= 12) { words = got2.slice(0, 12); fs.writeFileSync('E:/tmp/mm-words.json', JSON.stringify(words)); console.log('kata: 12 OK'); }
      else console.log('kata:', got2.length, '| err:', (Hr.match(/Incorrect password/i) || [])[0] || 'none');
    } else {
      console.log('review: password gak muncul — dump html');
      fs.writeFileSync('E:/tmp/mm-review-fail.html', await htmlOf(review));
    }
    dump(); continue;
  }
  if (reveal) {
    const f = reveal.locator('input[type="password"]').first();
    if (await f.count()) {
      await f.click(); await reveal.keyboard.type(PW, { delay: 50 }); await sleep(400);
      await reveal.locator('[data-testid="reveal-recovery-phrase-continue"]').click({ timeout: 12000 });
      console.log('→ reveal password submit'); await sleep(8000);
    } else console.log('reveal: password form gak ada (mungkin sudah terbuka)');
    const H = await htmlOf(reveal);
    fs.writeFileSync('E:/tmp/mm-reveal-final.html', H);
    console.log('reveal err:', (H.match(/Incorrect password/i) || [])[0] || 'NONE', '| url:', route(reveal));
    const re = /<li[^>]*>\s*(?:<[^>]+>\s*)*([a-z]{3,12})\s*(?:<[^>]+>\s*)*<\/li>/gi;
    let m; const got = [];
    while ((m = re.exec(H)) && got.length < 30) got.push(m[1]);
    if (got.length >= 12) { words = got.slice(0, 12); fs.writeFileSync('E:/tmp/mm-words.json', JSON.stringify(words)); console.log('kata: 12 OK'); }
    else console.log('kata:', got.length, '(kurang)');
    await reveal.screenshot({ path: 'E:/tmp/ui-audit/poles/p18-reveal.png' });
    const c = reveal.locator('[data-testid="reveal-recovery-phrase-continue"]');
    if (await c.count()) { await c.click({ timeout: 8000 }).catch(() => {}); console.log('→ lanjut ke quiz'); await sleep(7000); }
    dump(); continue;
  }
  if (confirm) {
    if (words.length < 12) { console.log('quiz tanpa kata — simpan html & stop'); fs.writeFileSync('E:/tmp/mm-quiz.html', await htmlOf(confirm)); break; }
    console.log('→ QUIZ mulai');
    for (let q = 0; q < 14; q++) {
      if (!/confirm-recovery-phrase/.test(confirm.url())) break;
      const Hq = await htmlOf(confirm);
      const n = parseInt((Hq.match(/word\s*#?\s*(\d+)/i) || [])[1], 10);
      if (!n) { console.log('quiz selesai!'); break; }
      const target = words[n - 1];
      try {
        await confirm.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first().click({ timeout: 6000 });
        console.log(`  ✓ word#${n}`);
      } catch { console.log(`  ✗ word#${n}`); fs.writeFileSync('E:/tmp/mm-quiz.html', await htmlOf(confirm)); break; }
      await sleep(1300);
      const cb = confirm.locator('button:has-text("Confirm"), button:has-text("Continue")').first();
      try { if (await cb.count() && await cb.isVisible()) { await cb.click({ timeout: 4000 }); await sleep(2500); } } catch {}
    }
    await sleep(7000); dump(); continue;
  }
  console.log('route tak dikenal:', mmTabs().map(route));
  if (mmTabs()[0]) fs.writeFileSync('E:/tmp/mm-unknown.html', await htmlOf(mmTabs()[0]));
  break;
}
dump();
await ctx.close();
