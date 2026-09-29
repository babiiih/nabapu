import { chromium } from 'playwright';
import fs from 'fs';

const BASE = 'https://web2-one-red.vercel.app';
const OUT = 'E:/tmp/ui-audit/after';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + String(e).slice(0, 300)));

async function shot(name, url, full = true) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
    console.log(`OK ${name} <- ${url}`);
  } catch (e) { console.log(`FAIL ${name}: ${e.message}`); }
}

await shot('01-home-desktop', `${BASE}/`);
await shot('02-market-desktop', `${BASE}/market`);
await shot('03-profile-desktop', `${BASE}/profile`);

// grab a token address from market page
let tokenAddr = null;
try {
  await page.goto(`${BASE}/market`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const hrefs = await page.$$eval('a[href*="/token/"]', as => as.map(a => a.getAttribute('href')));
  tokenAddr = hrefs.find(h => h && h.split('/').length > 2) || null;
} catch {}
console.log('token link:', tokenAddr);
if (tokenAddr) await shot('04-token-desktop', `${BASE}${tokenAddr}`);

// dark mode (toggle via class on html — shadcn default next-themes data attr)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await page.evaluate(() => {
  try {
    const stored = localStorage.getItem('vite-ui-theme');
    localStorage.setItem('vite-ui-theme', 'dark');
  } catch {}
  document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme = 'dark';
});
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/05-home-dark.png`, fullPage: true });
console.log('OK 05-home-dark');

// mobile viewport
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mp = await mctx.newPage();
try {
  await mp.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: `${OUT}/06-home-mobile.png`, fullPage: true });
  console.log('OK 06-home-mobile');
} catch (e) { console.log('FAIL mobile: ' + e.message); }

console.log('\n=== CONSOLE ERRORS (' + errors.length + ') ===');
errors.slice(0, 15).forEach(e => console.log('- ' + e));
await browser.close();
