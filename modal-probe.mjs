import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(7000);
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/t0-base.png' });

// semua kandidat modal/dialog/overlay di DOM
const dialogs = await p.evaluate(() => {
  const sels = ['[role="dialog"]', '[data-state]', '.modal', 'dialog', '[aria-modal="true"]', 'sheet', 'drawer'];
  const found = [];
  for (const s of sels) document.querySelectorAll(s).forEach(el => {
    const r = el.getBoundingClientRect();
    found.push({ sel: s, tag: el.tagName, cls: (el.className + '').slice(0, 80), visible: r.width > 0 && r.height > 0, w: Math.round(r.width), h: Math.round(r.height) });
  });
  return found;
});
console.log('DIALOGS at rest:', JSON.stringify(dialogs, null, 1));

// klik kartu pertama — apakah buka modal atau navigasi?
await p.click('.token-card');
await p.waitForTimeout(4000);
console.log('after card click url:', p.url());
const d2 = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('[role="dialog"], dialog, [aria-modal="true"], [data-state="open"]').forEach(el => {
    const r = el.getBoundingClientRect();
    out.push({ tag: el.tagName, cls: (el.className + '').slice(0, 100), visible: r.width > 0 && r.height > 0, w: Math.round(r.width), h: Math.round(r.height), text: el.textContent?.slice(0, 200) });
  });
  return out;
});
console.log('DIALOGS after click:', JSON.stringify(d2, null, 1));
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/t1-afterclick.png' });

await b.close();
