/**
 * Step 1: launch Chrome + MetaMask extension (persistent), dump halaman onboarding.
 * Run: cd web2 && node mm-onboard.mjs <step>
 */
import { chromium } from 'playwright';

const EXT = 'E:/cloak-browser/extensions/metamask';
const UD = 'E:/cloak-browser/profiles/mmtest/user-data';
const step = process.argv[2] || 'open';

const ctx = await chromium.launchPersistentContext(UD, {
  channel: 'chrome',
  headless: false,
  args: [`--load-extension=${EXT}`, '--no-first-run', '--no-default-browser-check'],
  viewport: { width: 1280, height: 900 },
});

// cari tab onboarding MetaMask (auto-terbuka) atau buka manual
let page = ctx.pages().find((p) => p.url().includes('nkbihmogkjlhbfcccfkobjknlniajfo'));
if (!page) {
  page = await ctx.newPage();
  await page.goto(`chrome-extension://nkbihmogkjlhbfcccfkobjknlniajfo/home.html#onboarding`);
}
await page.waitForTimeout(4000);

const info = {
  url: page.url().slice(0, 100),
  buttons: await page.evaluate(() =>
    [...document.querySelectorAll('button, a[role="button"], label')]
      .map((b) => (b.textContent || '').trim())
      .filter((t) => t && t.length < 60)
      .slice(0, 25),
  ),
  inputs: await page.evaluate(() =>
    [...document.querySelectorAll('input')].map((i) => `${i.type}:${i.name || i.id || i.placeholder || ''}`),
  ),
  text: (await page.evaluate(() => document.body.innerText)).slice(0, 600),
};
console.log(JSON.stringify(info, null, 1));
await page.screenshot({ path: 'E:/tmp/ui-audit/poles/mm-step.png' });

// JANGAN tutup context kalau diminta biar lanjut step berikutnya
if (step === 'keep') {
  console.log('KEEP: context hidup. pages:', ctx.pages().map((p) => p.url().slice(0, 80)));
  // simpan ws endpoint supaya step berikut bisa attach
  // (persistent context sulit attach — untuk multi-step, jalankan SEMUA dalam 1 script saja)
}
await ctx.close();
