import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://nabapu-app.vercel.app';
const pages = process.argv[3] ? process.argv[3].split(',') : ['trending','wallet','profile','nft','trenches'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const p of pages) {
  await page.goto(`${BASE}/nb/${p}`, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => (document.getElementById('root')?.innerHTML.length || 0) > 500, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const main = document.querySelector('.workspace main') || document.querySelector('.nb-app');
    const txt = (main?.innerText || '').replace(/\n{2,}/g, '\n').slice(0, 900);
    const imgs = [...document.querySelectorAll('.nb-app img')].map(i => ({ src: i.getAttribute('src')?.slice(0, 60), ok: i.complete && i.naturalWidth > 0 }));
    const badImgs = imgs.filter(i => !i.ok);
    return { text: txt, imgCount: imgs.length, badImgs: badImgs.slice(0, 4) };
  });
  console.log(`\n===== ${p} =====`);
  console.log(info.text);
  if (info.badImgs.length) console.log('BROKEN IMGS:', JSON.stringify(info.badImgs));
}
await browser.close();
