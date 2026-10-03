import { chromium } from 'playwright';
const base = 'file:///E:/builder/template/nabapu-market-terminal-latest/nabapu-ui/index.html';
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(base, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: 'E:/tmp/tpl-dashboard.png' });

for (const r of ['market', 'trending', 'trenches', 'profile']) {
  await page.goto(`${base}#/${r}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `E:/tmp/tpl-${r}.png` });
}
console.log('done');
await browser.close();
