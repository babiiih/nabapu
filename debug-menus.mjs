import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push('PAGEERROR: ' + String(e).slice(0, 200)));
p.on('console', m => { if (m.type() === 'error' && !m.text().includes('favicon')) errs.push('CONSOLE: ' + m.text().slice(0, 200)); });
p.on('response', r => { if (r.url().includes('launches') && !r.ok()) errs.push(`HTTP ${r.status()} ${r.url().slice(0, 120)}`); });

// TRENDING — tunggu lebih lama + baca state
await p.goto(`${BASE}/trending`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(12000);
const t = await p.evaluate(() => ({
  bodyText: document.body.innerText.slice(0, 400),
  tbodyRows: document.querySelectorAll('tbody tr').length,
  skeleton: document.querySelectorAll('.skeleton').length,
}));
console.log('TRENDING:', JSON.stringify(t, null, 1));

// WALLET — isi manual + Track
await p.goto(`${BASE}/wallet`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(3000);
await p.fill('input[placeholder*="wallet"]', '0x35F76E0d2D955beED6e3752F24b4c2570e481B04');
await p.click('button:has-text("Track")');
await p.waitForTimeout(6000);
const w = await p.evaluate(() => ({
  feedRows: document.querySelectorAll('.feed-row').length,
  stats: [...document.querySelectorAll('div')].map(x => x.textContent).find(t => t && t.includes('buys ·'))?.slice(0, 100) || null,
  bodySnippet: document.body.innerText.slice(0, 350),
}));
console.log('WALLET:', JSON.stringify(w, null, 1));

console.log('errors:', errs.length ? errs : 'none');
await b.close();
