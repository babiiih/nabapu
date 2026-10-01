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
const cdpOf = async (p) => ctx.newCDPSession(p);
const htmlOf = async (cdp) => (await cdp.send('DOM.getOuterHTML', { nodeId: (await cdp.send('DOM.getDocument', { depth: -1 })).root.nodeId })).outerHTML;
const findTab = (rx) => ctx.pages().find((p) => rx.test(p.url()));
const dumpTabs = () => console.log('tabs:', ctx.pages().map((p) => (p.url().includes(extId) ? 'MM:' + (p.url().split('#')[1] || '/') : p.url().slice(0, 30))));

dumpTabs();

// 1. passkey tab → Maybe later
let tab = findTab(/setup-passkey/);
if (tab) {
  await tab.bringToFront().catch(() => {});
  await tab.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 15000 });
  console.log('→ passkey: Maybe later');
  await sleep(5000);
  dumpTabs();
}
// 2. review tab → continue
tab = findTab(/review-recovery-phrase/);
if (tab) {
  const cdp = await cdpOf(tab);
  console.log('review text:', (await htmlOf(cdp)).replace(/<[^>]+>/g, '|').replace(/\|+/g, ' | ').match(/Review[^|]{0,80}|password[^|]{0,60}/i));
  await tab.locator('[data-testid="reveal-recovery-phrase-continue"], button:has-text("Continue")').first().click({ timeout: 12000 }).catch((e) => console.log('review continue:', e.message.slice(0, 80)));
  await sleep(5000);
  dumpTabs();
}
// 3. reveal tab → password (KEYBOARD!) → continue
tab = findTab(/reveal-recovery-phrase/);
if (tab) {
  await tab.bringToFront().catch(() => {});
  const cdp = await cdpOf(tab);
  let H = await htmlOf(cdp);
  console.log('reveal state:', (H.match(/Enter password[^|]{0,40}|Incorrect password/i) || [])[0] || '?');
  const field = tab.locator('input[type="password"]').first();
  if (await field.count()) {
    await field.click();
    await tab.keyboard.press('Control+A');
    await tab.keyboard.type(PW, { delay: 50 });
    await sleep(400);
    await tab.locator('[data-testid="reveal-recovery-phrase-continue"]').click({ timeout: 12000 });
    await sleep(6000);
    H = await htmlOf(cdp);
    fs.writeFileSync('E:/tmp/mm-revealed2.html', H);
    console.log('setelah reveal → err:', (H.match(/Incorrect password/i) || [])[0] || 'none', '| len:', H.length);
  } else console.log('password field gak ada (mungkin udah reveal)');
  dumpTabs();
  // 4. ekstrak kata dari html
  const words = [];
  const re = /<li[^>]*class="[^"]*(?:seed|phrase|word)[^"]*"[^>]*>[\s\S]{0,120}?>([a-z]{3,12})</gi;
  let m;
  while ((m = re.exec(H)) && words.length < 12) words.push(m[1]);
  if (words.length < 12) {
    const re2 = /<[^>]+data-testid="[^"]*word[^"]*"[^>]*>([a-z]{3,12})</gi;
    while ((m = re2.exec(H)) && words.length < 12) words.push(m[1]);
  }
  console.log('kata:', words.length, words.length >= 12 ? '(ok, masked)' : '(gagal — cek /tmp/mm-revealed2.html)');
  fs.writeFileSync('E:/tmp/mm-words.json', JSON.stringify(words));

  // 5. lanjut: klik continue/reveal sampai quiz
  for (let i = 0; i < 3; i++) {
    const t2 = findTab(/reveal-recovery-phrase|confirm-recovery-phrase|completion|all-done/);
    if (!t2) break;
    const b = t2.locator('button:has-text("Continue"), [data-testid*="continue"]').first();
    if (await b.count()) { await b.click({ timeout: 6000 }).catch(() => {}); await sleep(4000); }
    else break;
    dumpTabs();
  }
}
// 6. quiz
tab = findTab(/confirm-recovery-phrase/);
if (tab && words.length >= 12) {
  console.log('→ masuk quiz');
  for (let q = 0; q < 14; q++) {
    const cdp = await cdpOf(tab);
    const Hq = await htmlOf(cdp);
    const n = parseInt((Hq.match(/word\s*#?\s*(\d+)/i) || [])[1], 10);
    if (!n) { console.log('quiz selesai'); break; }
    const target = words[n - 1];
    const chip = tab.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first();
    try { await chip.click({ timeout: 6000 }); console.log(`  ✓ word#${n}`); } catch { console.log(`  ✗ chip word#${n}`); break; }
    await sleep(1200);
    const cb = tab.locator('button:has-text("Confirm"), button:has-text("Continue")').first();
    try { if (await cb.count() && await cb.isVisible()) { await cb.click({ timeout: 4000 }); await sleep(2500); } } catch {}
  }
}
dumpTabs();
const home = ctx.pages().find((p) => p.url().includes(extId) && !/#\/onboarding/i.test(p.url()));
console.log('HOME READY?', home ? home.url.slice(-40) : false);
await ctx.close();
