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
const cdpOf = (p) => ctx.newCDPSession(p);
async function htmlOf(p) {
  const cdp = await cdpOf(p);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  await cdp.detach().catch(() => {});
  return outerHTML;
}
const tabsMM = () => ctx.pages().filter((p) => p.url().includes(extId));
const route = (p) => p.url().split('#')[1] || '/';
const dump = () => console.log('tabs:', tabsMM().map(route));
const findRoute = (rx) => tabsMM().find((p) => rx.test(p.url()));

const main = await ctx.newPage();
await main.goto(`chrome-extension://${extId}/home.html`);
await sleep(6000);

// 0. unlock (KEYBOARD)
if (/unlock/i.test(main.url())) {
  const f = main.locator('input[type="password"]').first();
  await f.click();
  await main.keyboard.type(PW, { delay: 50 });
  await main.locator('button:has-text("Unlock")').first().click();
  await sleep(6000);
  console.log('unlock →', route(main));
}
dump();

// helper: kalau route tertentu ada, tangani
let words = [];
for (let round = 0; round < 12; round++) {
  dump();
  const passkey = findRoute(/setup-passkey/);
  const review = findRoute(/review-recovery-phrase/);
  const reveal = findRoute(/reveal-recovery-phrase/);
  const confirm = findRoute(/confirm-recovery-phrase/);
  const home = findRoute(/#\/$|home\.html$|#\/(assets|portfolio|wallet)/);

  if (home) { console.log('✓ HOME:', route(home)); break; }

  if (passkey) {
    await passkey.bringToFront().catch(() => {});
    await passkey.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 12000 });
    console.log('→ passkey skip'); await sleep(5000); continue;
  }
  if (review) {
    await review.bringToFront().catch(() => {});
    const H = await htmlOf(review);
    const t = (H.replace(/<[^>]+>/g, '|').match(/Enter password[^|]{0,40}|Back up[^|]{0,60}|Review[^|]{0,60}/i) || [])[0];
    console.log('review page:', t || '?');
    if (/Enter password/i.test(H)) {
      const f = review.locator('input[type="password"]').first();
      await f.click(); await review.keyboard.type(PW, { delay: 50 });
      await review.locator('[data-testid*="continue"]').first().click({ timeout: 10000 });
      console.log('→ review password submit'); await sleep(6000);
    } else {
      await review.locator('[data-testid*="continue"], button:has-text("Continue")').first().click({ timeout: 10000 }).catch(() => {});
      console.log('→ review continue'); await sleep(5000);
    }
    continue;
  }
  if (reveal) {
    await reveal.bringToFront().catch(() => {});
    let H = await htmlOf(reveal);
    if (/Enter password/i.test(H)) {
      const f = reveal.locator('input[type="password"]').first();
      await f.click(); await reveal.keyboard.type(PW, { delay: 50 });
      await sleep(300);
      await reveal.locator('[data-testid*="continue"]').first().click({ timeout: 10000 });
      await sleep(6000);
      H = await htmlOf(reveal);
      console.log('reveal submit → err:', (H.match(/Incorrect password/i) || [])[0] || 'none');
    }
    fs.writeFileSync('E:/tmp/mm-reveal-final.html', H);
    // ekstrak 12 kata: setiap pola
    if (words.length < 12) {
      const pats = [
        /<li[^>]*>(?:<[^>]+>)*([a-z]{3,12})(?:<[^>]+>)*<\/li>/gi,
        /data-testid="[^"]*word[^"]*"[^>]*>([a-z]{3,12})</gi,
        /class="[^"]*seed-phrase__words[^"]*"[\s\S]{0,3000}?/i,
      ];
      const got = [];
      const re = /<li[^>]*>(?:<[^>]+>)*([a-z]{3,12})(?:<[^>]+>)*<\/li>/gi;
      let m; while ((m = re.exec(H)) && got.length < 20) got.push(m[1]);
      if (got.length >= 12) words = got.slice(0, 12);
      console.log('kata terbaca:', got.length, got.length >= 12 ? '(12 OK)' : '');
    }
    if (words.length >= 12) fs.writeFileSync('E:/tmp/mm-words.json', JSON.stringify(words));
    // lanjut
    const cont = reveal.locator('[data-testid*="continue"], button:has-text("Continue")').first();
    if (await cont.count()) { await cont.click({ timeout: 8000 }).catch(() => {}); await sleep(5000); }
    continue;
  }
  if (confirm) {
    await confirm.bringToFront().catch(() => {});
    console.log('→ QUIZ confirm-recovery-phrase, kata:', words.length);
    if (words.length < 12) { console.log('kata gak cukup — gagal'); break; }
    for (let q = 0; q < 14; q++) {
      const Hq = await htmlOf(confirm);
      const n = parseInt((Hq.match(/word\s*#?\s*(\d+)/i) || [])[1], 10);
      if (!n) { console.log('quiz selesai!'); break; }
      const target = words[n - 1];
      try {
        await confirm.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first().click({ timeout: 6000 });
        console.log(`  ✓ word#${n}`);
      } catch { console.log(`  ✗ chip word#${n} ('${target}')`); break; }
      await sleep(1200);
      const cb = confirm.locator('button:has-text("Confirm"), button:has-text("Continue")').first();
      try { if (await cb.count() && await cb.isVisible()) { await cb.click({ timeout: 4000 }); await sleep(2500); } } catch {}
      if (!/confirm-recovery-phrase/.test(confirm.url())) break;
    }
    await sleep(5000);
    continue;
  }
  // route lain: coba klik tombol completion umum
  const p0 = tabsMM()[0];
  if (p0) {
    const H0 = await htmlOf(p0);
    fs.writeFileSync('E:/tmp/mm-unknown-route.html', H0);
    let clicked = false;
    for (const t of ['Done', 'Got it', 'All done', 'Get started']) {
      try { const b = p0.locator(`button:has-text("${t}")`).first(); if (await b.count()) { await b.click({ timeout: 4000 }); console.log('→ completion:', t); clicked = true; await sleep(4000); break; } } catch {}
    }
    if (!clicked) { console.log('route tak dikenal:', route(p0), '— stop'); break; }
  }
}
dump();
await ctx.close();
