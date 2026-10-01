import { chromium } from 'playwright';
import fs from 'fs';

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
// buka tab onboarding yang nyangkut
const tab = await ctx.newPage();
await tab.goto(`chrome-extension://${extId}/home.html#/onboarding/review-recovery-phrase`);
await sleep(6000);

const cdp = await ctx.newCDPSession(tab);
const html = async () => {
  const doc = await cdp.send('DOM.getDocument', { depth: -1, pierce: true });
  const res = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  return res.outerHTML;
};
const btnDump = async (tag) => {
  const n = await tab.locator('button').count();
  const arr = [];
  for (let i = 0; i < Math.min(n, 16); i++) {
    const b = tab.locator('button').nth(i);
    arr.push(`[${await b.getAttribute('data-testid') || '-'}]${(await b.getAttribute('aria-label') || '').slice(0, 30)}`);
  }
  const inputs = await tab.locator('input').count();
  console.log(`[${tag}] inputs=${inputs} btn=${JSON.stringify(arr)}`);
};

await btnDump('review');
let H = await html();
console.log('html len:', H.length);
// tombol reveal
const revealBtn = tab.locator('button', { hasText: /Reveal/i }).first();
if (await revealBtn.count()) {
  await revealBtn.click({ timeout: 15000 });
  console.log('→ Reveal diklik');
  await sleep(3000);
} else {
  // mungkin butuh checkbox dulu
  const cb = tab.locator('input[type="checkbox"]').first();
  if (await cb.count()) { await cb.check().catch(() => {}); await sleep(800); }
  if (await revealBtn.count()) { await revealBtn.click({ timeout: 8000 }).catch(() => {}); console.log('→ Reveal (setelah checkbox)'); await sleep(3000); }
}
await btnDump('after-reveal');
H = await html();
fs.writeFileSync('E:/tmp/mm-review.html', H);
console.log('html disimpan:', H.length);

// ekstrak 12 kata (struktur MM: elemen ber-class seed/phrase words)
const wordsMatch = H.match(/class="[^"]*(?:seed|phrase|word)[^"]*"[^>]*>([^<]{2,20})</gi) || [];
console.log('kandidat kata (masked):', wordsMatch.length, wordsMatch.slice(0, 4).map(s => s.slice(-6)));

// lanjut: cari tombol Continue/Confirm di review
for (const t of ['Continue', 'Confirm', 'Next']) {
  const b = tab.locator('button', { hasText: new RegExp(`^\\s*${t}\\s*$`, 'i') }).first();
  try { await b.click({ timeout: 5000 }); console.log('→ review continue:', t); await sleep(4000); break; } catch {}
}
await btnDump('post-review');
const H2 = await html();
fs.writeFileSync('E:/tmp/mm-post-review.html', H2);
console.log('post-review html:', H2.length);
console.log('url tab:', tab.url().slice(0, 95));
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p10-review.png' });
await ctx.close();
