import { chromium } from 'playwright';
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 200)));
await page.goto('file:///E:/builder/vibes/cex/index.html', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForSelector('#chart rect', { timeout: 30000 }).catch(() => console.log('chart not rendered'));
await page.waitForTimeout(5000); // tailwind browser CDN compiles async
await page.screenshot({ path: 'E:/tmp/ui-audit/cex-light.png', fullPage: true });
// html starts dark; toggle to light for second shot
await page.click('#themeToggle').catch(e => console.log('toggle fail', e.message));
await page.waitForTimeout(800);
await page.screenshot({ path: 'E:/tmp/ui-audit/cex-light2.png', fullPage: false });
console.log('errors:', errors.length, errors.slice(0, 5));
await browser.close();
