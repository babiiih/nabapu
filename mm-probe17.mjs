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
const typePassword = async (p) => {
  const f = p.locator('input[type="password"]').first();
  await f.click();
  await p.keyboard.type(PW, { delay: 50 });
  await sleep(300);
};

let main = await ctx.newPage();
await main.goto(`chrome-extension://${extId}/home.html`);
await sleep(6000);
dump();

for (let round = 0; round < 15; round++) {
  // HOME?
  const home = mmTabs().find((p) => !/#\/onboarding|unlock/i.test(p.url()));
  if (home) { console.log('🎉 HOME:', route(home)); break; }

  const unlock = findR(/unlock/);
  const passkey = findR(/setup-passkey/);
  const reveal = findR(/review-recovery-phrase|reveal-recovery-phrase/);
  const confirm = findR(/confirm-recovery-phrase/);

  if (unlock) {
    await typePassword(unlock);
    await unlock.locator('button:has-text("Unlock")').first().click();
    console.log('→ unlock'); await sleep(6000); dump(); continue;
  }
  if (passkey) {
    await passkey.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 12000 });
    console.log('→ passkey skip'); await sleep(6000); dump(); continue;
  }
  if (reveal) {
    await typePassword(reveal);
    await reveal.locator('[data-testid="reveal-recovery-phrase-continue"]').click({ timeout: 12000 });
    console.log('→ reveal password submit'); await sleep(7000);
    const H = await htmlOf(reveal);
    fs.writeFileSync('E:/tmp/mm-reveal-final.html', H);
    const err = (H.match(/Incorrect password/i) || [])[0];
    console.log('reveal err:', err || 'NONE', '| url:', route(reveal));
    // baca 12 kata
    const words = [];
    const re = /<li[^>]*>\s*(?:<[^>]+>\s*)*([a-z]{3,12})\s*(?:<[^>]+>\s*)*<\/li>/gi;
    let m; while ((m = re.exec(H)) && words.length < 30) words.push(m[1]);
    console.log('kata kandidat:', words.length, words.length >= 12 ? '(>=12 OK)' : '');
    if (words.length >= 12) fs.writeFileSync('E:/tmp/mm-words.json', JSON.stringify(words.slice(0, 12)));
    // screenshot untuk jaga-jaga
    await reveal.screenshot({ path: 'E:/tmp/ui-audit/poles/p17-reveal.png' });
    // lanjut ke quiz
    await reveal.locator('[data-testid="reveal-recovery-phrase-continue"]').click({ timeout: 8000 }).catch(() => {});
    await sleep(6000); dump();
    // simpan words utk quiz (keluar loop dgn return?)
    globalThis.__words = words.slice(0, 12);
    continue;
  }
  if (confirm) {
    const words = globalThis.__words || [];
    if (words.length < 12) { console.log('quiz tanpa kata — stop'); 
      const Hc = await htmlOf(confirm); fs.writeFileSync('E:/tmp/mm-quiz.html', Hc); break; }
    console.log('→ QUIZ');
    for (let q = 0; q < 14; q++) {
      if (!/confirm-recovery-phrase/.test(confirm.url())) break;
      const Hq = await htmlOf(confirm);
      const n = parseInt((Hq.match(/word\s*#?\s*(\d+)/i) || [])[1], 10);
      if (!n) { console.log('quiz selesai (gak ada prompt)'); break; }
      const target = words[n - 1];
      try {
        await confirm.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first().click({ timeout: 6000 });
        console.log(`  ✓ word#${n}`);
      } catch { console.log(`  ✗ word#${n} '${target}' gak ketemu`); 
        const Hc = await htmlOf(confirm); fs.writeFileSync('E:/tmp/mm-quiz.html', Hc); break; }
      await sleep(1300);
      const cb = confirm.locator('button:has-text("Confirm"), button:has-text("Continue")').first();
      try { if (await cb.count() && await cb.isVisible()) { await cb.click({ timeout: 4000 }); await sleep(2500); } } catch {}
    }
    await sleep(6000); dump(); continue;
  }
  console.log('route tak dikenal:', mmTabs().map(route));
  const p0 = mmTabs()[0];
  if (p0) fs.writeFileSync('E:/tmp/mm-unknown.html', await htmlOf(p0));
  break;
}
dump();
await ctx.close();
