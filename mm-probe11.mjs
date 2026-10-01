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
const tab = await ctx.newPage();
await tab.goto(`chrome-extension://${extId}/home.html#/onboarding/reveal-recovery-phrase`);
await sleep(5000);

const cdp = await ctx.newCDPSession(tab);
const html = async () => (await cdp.send('DOM.getOuterHTML', { nodeId: (await cdp.send('DOM.getDocument', { depth: -1 })).root.nodeId })).outerHTML;
const btnDump = async (tag) => {
  const n = await tab.locator('button').count();
  const arr = [];
  for (let i = 0; i < Math.min(n, 20); i++) {
    const b = tab.locator('button').nth(i);
    arr.push(`[${await b.getAttribute('data-testid') || '-'}]`);
  }
  console.log(`[${tag}] inputs=${await tab.locator('input').count()} btn=${JSON.stringify(arr)} url=${tab.url().split('#')[1] || ''}`);
};

await btnDump('awal');
// 1. isi password reveal
const pw = tab.locator('input[type="password"]').first();
await pw.fill(PW);
await sleep(500);
await tab.locator('[data-testid="reveal-recovery-phrase-continue"]').click({ timeout: 15000 });
console.log('→ continue (password reveal) diklik');
await sleep(5000);
await btnDump('setelah-password');
let H = await html();
fs.writeFileSync('E:/tmp/mm-revealed.html', H);
console.log('html revealed:', H.length);

// 2. ekstrak kata: MM v13 biasanya span per kata dalam container seed-phrase
const extractWords = (s) => {
  // pola A: <li><span...>word</span>  /  data-testid word
  let m = s.match(/data-testid="[^"]*seed[^"]*"[^>]*>/gi);
  // pola B: teks dalam elemen ber-index
  const chunks = [...s.matchAll(/<[^>]*class="[^"]*(?:seed|phrase|word)[^"]*"[^>]*>([a-zA-Z]{3,12})</gi)].map(x => x[1]);
  if (chunks.length >= 12) return chunks.slice(0, 12);
  // pola C: aria/list number + kata
  const chunks2 = [...s.matchAll(/<li[^>]*>\s*<[^>]*>([a-zA-Z]{3,12})<[^>]*>\s*<\/li>/gi)].map(x => x[1]);
  if (chunks2.length >= 12) return chunks2.slice(0, 12);
  return chunks;
};
let words = extractWords(H);
console.log('kata terbaca:', words.length, words.length ? `(contoh: ${words[0]}, ${words[1]}, …)` : '(gak ada)');

// 3. lanjut ke quiz (kalau ada tombol continue/reveal)
for (const sel of ['[data-testid="recovery-phrase-continue"]', '[data-testid*="continue"]', 'button']) {
  try {
    const b = sel === 'button' ? tab.locator('button', { hasText: /^Continue$/i }).first() : tab.locator(sel).first();
    if (await b.count() && await b.isVisible()) { await b.click({ timeout: 5000 }); console.log('→ klik', sel); await sleep(4000); break; }
  } catch {}
}
await btnDump('quiz-candidate');
const H2 = await html();
fs.writeFileSync('E:/tmp/mm-quiz.html', H2);
console.log('quiz html:', H2.length, 'url:', tab.url().split('#')[1]);

// kalau ada instruksi "word #N" → jawab klik chip sesuai words
const promptN = (H2.match(/word\s*#?\s*(\d+)/i) || [])[1];
console.log('prompt word#:', promptN || '(belum ada)');
if (promptN && words.length >= 12) {
  for (let q = 0; q < 15; q++) {
    const Hq = await html();
    const n = parseInt((Hq.match(/word\s*#?\s*(\d+)/i) || [])[1], 10);
    if (!n) { console.log('quiz selesai (gak ada prompt)'); break; }
    const target = words[n - 1];
    // klik chip kata
    const chip = tab.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first();
    try { await chip.click({ timeout: 6000 }); console.log(`  ✓ word#${n}`); } catch { console.log(`  ✗ chip '${target}' gak ketemu`); break; }
    await sleep(1500);
    // tombol confirm di akhir
    for (const t of ['Confirm', 'Continue']) {
      try { const cb = tab.locator('button', { hasText: new RegExp(`^\\s*${t}\\s*$`, 'i') }).first(); if (await cb.count() && await cb.isVisible()) { await cb.click({ timeout: 4000 }); console.log('  →', t); await sleep(2500); } } catch {}
    }
  }
}
await btnDump('akhir');
await tab.screenshot({ path: 'E:/tmp/ui-audit/poles/p11-akhir.png' });
console.log('url akhir:', tab.url().slice(-60));
await ctx.close();
