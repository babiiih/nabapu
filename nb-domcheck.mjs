import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://nabapu-ejlme34au-babiiihs-projects.vercel.app';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/nb/dashboard`, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
await page.waitForFunction(() => (document.getElementById('root')?.innerHTML.length || 0) > 500, { timeout: 20000 }).catch(() => {});
await page.waitForTimeout(3000);
const check = await page.evaluate(() => {
  const q = (s) => !!document.querySelector(s);
  const links = [...document.querySelectorAll('.sidebar nav a')].map(a => a.getAttribute('href')).slice(0, 12);
  return {
    nbApp: q('.nb-app'),
    shell: q('.shell'),
    sidebar: q('.sidebar'),
    topbar: q('.topbar'),
    tape: q('.tape, .market-tape'),
    sidebarLinks: links,
    heroOrHeading: q('.hero') || q('.page-heading'),
    statsCards: document.querySelectorAll('.stat-card, .stats-grid > div').length,
    tokenCards: document.querySelectorAll('.token-card').length,
    tables: document.querySelectorAll('table').length,
    tableRows: document.querySelectorAll('tbody tr, .screen-row').length,
    bodyBg: getComputedStyle(document.querySelector('.nb-app') || document.body).backgroundColor,
    h1: document.querySelector('h1')?.textContent?.slice(0, 60) || '',
  };
});
console.log(JSON.stringify(check, null, 2));
await browser.close();
