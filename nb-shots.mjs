import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://nabapu.vercel.app';
const pages = ['dashboard','market','trending','trenches','wallet','nft','profile'];
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
for (const p of pages) {
  await page.goto(`${BASE}/nb/${p}`, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => (document.getElementById('root')?.innerHTML.length || 0) > 500, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3500);
  const len = await page.evaluate(() => document.getElementById('root')?.innerHTML.length || 0);
  await page.screenshot({ path: `E:/tmp/ui-audit/nb3-${p}.png` });
  console.log(p, 'root_len=', len);
}
await browser.close();
