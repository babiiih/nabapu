import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:4173/nb/dashboard', { waitUntil: 'load', timeout: 45000 }).catch(() => {});
await p.waitForFunction(() => (document.getElementById('root')?.innerHTML.length || 0) > 500, { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(3000);
const c = await p.evaluate(() => {
  const g = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).backgroundColor : null; };
  const t = (sel) => { const el = document.querySelector(sel); return el ? getComputedStyle(el).color : null; };
  return {
    shell: g('.shell'), hero: g('.hero'), heroCopy: g('.hero-copy'),
    statCard: g('.stat-card'), tokenCard: g('.token-card'),
    discovery: g('.discovery-zone'), intel: g('.intel-panel'),
    sidebar: g('.sidebar'), topbar: g('.topbar'), tape: g('.market-tape'),
    h1: t('.hero h1'), h1span: t('.hero h1 span'), tableWrap: g('.table-wrap'),
  };
});
console.log(JSON.stringify(c, null, 1));
await b.close();
