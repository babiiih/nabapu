import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 150)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push(m.text().slice(0, 150)); });

const results = {};

// 1. Trending
await p.goto(`${BASE}/trending`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(6000);
results.trending = await p.evaluate(() => {
  const rows = [...document.querySelectorAll('tbody tr')];
  return {
    heading: document.querySelector('h1')?.textContent,
    rows: rows.length,
    firstRow: rows[0]?.textContent?.slice(0, 120) || null,
  };
});
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/m-trending.png', fullPage: false });

// 2. Trenches
await p.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(6000);
results.trenches = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('.token-card')];
  const search = document.querySelector('input[placeholder*="contract"]');
  return {
    heading: document.querySelector('h1')?.textContent,
    cards: cards.length,
    firstCard: cards[0]?.textContent?.slice(0, 100) || null,
    searchInput: !!search,
  };
});
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/m-trenches.png', fullPage: false });

// 3. Trenches CA search — pakai CA NRWA yang asli
const CA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0';
await p.fill('input[placeholder*="contract"]', CA);
await p.click('button:has-text("Open")');
await p.waitForTimeout(6000);
results.caSearch = { url: p.url(), heading: await p.evaluate(() => document.querySelector('h1')?.textContent) };

// 4. Wallet — track dev wallet
await p.goto(`${BASE}/wallet`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(6000);
results.wallet = await p.evaluate(() => {
  const feed = document.querySelector('.feed');
  return {
    heading: document.querySelector('h1')?.textContent,
    feedRows: feed ? feed.children.length : 0,
    stats: [...document.querySelectorAll('.tabular-nums')].map(x => x.textContent).find(t => t.includes('buys')) || null,
    firstRow: feed?.children[0]?.textContent?.slice(0, 100) || null,
  };
});
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/m-wallet.png', fullPage: false });

// 5. sidebar nav
await p.goto(`${BASE}/market`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(3000);
results.sidebar = await p.evaluate(() => {
  const links = [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href'));
  return ['/trending', '/trenches', '/wallet'].map(h => ({ [h]: links.includes(h) }));
});

console.log(JSON.stringify(results, null, 1));
console.log('errors:', errs.length ? errs : 'none');
await b.close();
