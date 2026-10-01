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
const mmTabs = () => ctx.pages().filter((p) => p.url().includes(extId));
const htmlOf = async (p) => {
  const cdp = await ctx.newCDPSession(p);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  await cdp.detach().catch(() => {});
  return outerHTML;
};
const main = await ctx.newPage();
await main.goto(`chrome-extension://${extId}/home.html`);
await sleep(7000);

// sampai quiz (rantai yang udah teruji)
const unlock = mmTabs().find((p) => /unlock/.test(p.url()));
if (unlock) {
  const f = unlock.locator('input[type="password"]').first();
  await f.click(); await unlock.keyboard.type(PW, { delay: 50 }); await sleep(300);
  await unlock.locator('button:has-text("Unlock")').first().click(); await sleep(7000);
}
const pk = mmTabs().find((p) => /setup-passkey/.test(p.url()));
if (pk) { await pk.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 15000 }).catch(() => {}); await sleep(8000); }
const review = mmTabs().find((p) => /review-recovery-phrase/.test(p.url()));
if (review) {
  await sleep(5000);
  try { const t = review.locator('text=/Tap to reveal/i').first(); if (await t.count()) { await t.click({ timeout: 5000 }); await sleep(1500); } } catch {}
  try { await review.locator('li').first().click({ timeout: 3000 }); } catch {}
  const c = review.locator('[data-testid="recovery-phrase-continue"]');
  for (let k = 0; k < 10; k++) { if (await c.count() && !(await c.isDisabled())) break; await sleep(2000); }
  await c.click({ timeout: 10000 });
  console.log('→ review continue');
  await sleep(8000);
}
const confirm = mmTabs().find((p) => /confirm-recovery-phrase/.test(p.url()));
if (!confirm) { console.log('quiz gak kebuka. tabs:', mmTabs().map(p => p.url().split('#')[1])); await ctx.close(); process.exit(1); }

await confirm.bringToFront().catch(() => {});
await sleep(4000);
await confirm.screenshot({ path: 'E:/tmp/ui-audit/poles/quiz-before.png' });
const H1 = await htmlOf(confirm);
fs.writeFileSync('E:/tmp/quiz-before.html', H1);
const q1 = (H1.match(/data-quiz-words="([^"]+)"/) || [])[1];
console.log('quiz-words:', q1);

// klik chip pertama (urut index)
const words = JSON.parse(q1.replace(/&quot;/g, '"')).sort((a, b) => a.index - b.index);
const first = words[0].word;
const chip = confirm.locator('button', { hasText: new RegExp(`^\\s*${first}\\s*$`, 'i') }).first();
const nBefore = await confirm.locator('button').count();
console.log(`klik '${first}' — jumlah button: ${nBefore}`);
await chip.click({ timeout: 8000 });
console.log('klik ok');
await sleep(2500);
await confirm.screenshot({ path: 'E:/tmp/ui-audit/poles/quiz-after1.png' });
const H2 = await htmlOf(confirm);
fs.writeFileSync('E:/tmp/quiz-after1.html', H2);
const slots1 = [...H1.matchAll(/recovery-phrase-chip-(\d+)"[^>]*value="([^"]*)"/g)].map(m => m[1] + '=' + m[2]);
const slots2 = [...H2.matchAll(/recovery-phrase-chip-(\d+)"[^>]*value="([^"]*)"/g)].map(m => m[1] + '=' + m[2]);
console.log('slots BEFORE:', slots1.join(','));
console.log('slots AFTER :', slots2.join(','));
const bank1 = [...H1.matchAll(/quiz-unanswered-(\d+)"[^>]*>\s*<span[^>]*>([^<]+)/g)].map(m => m[2]);
const bank2 = [...H2.matchAll(/quiz-unanswered-(\d+)"[^>]*>\s*<span[^>]*>([^<]+)/g)].map(m => m[2]);
console.log('bank BEFORE:', bank1, ' AFTER:', bank2);
console.log('button count after:', await confirm.locator('button').count());
await ctx.close();
