import { chromium } from 'playwright';

const url = process.argv[2] || 'https://cex-rosy.vercel.app';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 150)));
page.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text().slice(0, 150)); });

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
await page.waitForTimeout(6000);

const report = await page.evaluate(() => {
  const cs = el => el ? getComputedStyle(el) : null;
  return {
    bodyBg: cs(document.body).backgroundColor,
    asks: document.querySelectorAll('#asks > div').length,
    bids: document.querySelectorAll('#bids > div').length,
    candles: document.querySelectorAll('#chart rect').length,
    markets: document.querySelectorAll('#marketsBody tr').length,
    orders: document.querySelectorAll('#ordersBody tr').length,
    price: document.getElementById('lastPrice')?.textContent,
    priceColor: cs(document.getElementById('lastPrice'))?.color,
    buyBtnBg: cs(document.getElementById('submitBtn'))?.backgroundColor,
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
  };
});
console.log(JSON.stringify(report));
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
