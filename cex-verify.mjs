import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(String(e).slice(0, 150)));

await page.goto('file:///E:/builder/vibes/cex/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(5000); // tailwind CDN compile

const report = await page.evaluate(() => {
  const cs = el => el ? getComputedStyle(el) : null;
  const body = cs(document.body);
  const checks = {};
  checks.bodyBg = body.backgroundColor;
  checks.asksRows = document.querySelectorAll('#asks > div').length;
  checks.bidsRows = document.querySelectorAll('#bids > div').length;
  checks.chartCandles = document.querySelectorAll('#chart rect').length;
  checks.marketsRows = document.querySelectorAll('#marketsBody tr').length;
  checks.ordersRows = document.querySelectorAll('#ordersBody tr').length;
  checks.tradesRows = document.querySelectorAll('#tradesFeed > div').length;
  checks.tickerItems = document.querySelectorAll('#tickerStrip span span').length;
  const price = document.getElementById('lastPrice');
  checks.priceColor = cs(price).color;
  checks.priceFont = cs(price).fontWeight + ' ' + cs(price).fontSize;
  const buyBtn = document.getElementById('submitBtn');
  checks.buyBtnBg = cs(buyBtn).backgroundColor;
  const card = document.querySelector('section.border-border');
  checks.cardBg = cs(card).backgroundColor;
  checks.cardRadius = cs(card).borderRadius;
  checks.cardBorder = cs(card).borderColor;
  // unstyled detection: any element still with transparent bg where it should have one
  checks.htmlDark = document.documentElement.classList.contains('dark');
  // horizontal overflow
  checks.docScrollW = document.documentElement.scrollWidth;
  checks.winW = window.innerWidth;
  return checks;
});
console.log(JSON.stringify(report, null, 2));
console.log('pageerrors:', errors);

// light mode
await page.click('#themeToggle').catch(e => console.log('toggle fail', e.message));
await page.waitForTimeout(600);
const light = await page.evaluate(() => ({
  dark: document.documentElement.classList.contains('dark'),
  bodyBg: getComputedStyle(document.body).backgroundColor,
}));
console.log('after toggle:', JSON.stringify(light));
await browser.close();
