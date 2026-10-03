import { chromium } from 'playwright';
const BASE = process.argv[2] || 'https://nabapu-app.vercel.app';
const pages = ['dashboard','market','trending','trenches','wallet','nft','profile'];
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

for (const p of pages) {
  await page.goto(`${BASE}/nb/${p}`, { waitUntil: 'load', timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => (document.getElementById('root')?.innerHTML.length || 0) > 500, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const issues = await page.evaluate(() => {
    const out = { hOverflow: [], clipped: [], overlap: [], tinyText: [], empty: [], rawWei: [] };
    const de = document.documentElement;
    if (de.scrollWidth > de.clientWidth + 2) out.hOverflow.push(`doc ${de.scrollWidth}>${de.clientWidth}`);
    // horizontal overflow containers
    for (const el of document.querySelectorAll('.nb-app *')) {
      if (el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0 && getComputedStyle(el).overflowX !== 'auto' && getComputedStyle(el).overflowX !== 'scroll' && !el.className.toString().includes('tape')) {
        out.hOverflow.push(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} sw=${el.scrollWidth} cw=${el.clientWidth}`);
      }
    }
    // clipped text: overflow hidden with text wider than box
    for (const el of document.querySelectorAll('.nb-app *')) {
      const cs = getComputedStyle(el);
      if (cs.overflow === 'hidden' && el.scrollWidth > el.clientWidth + 6 && el.clientWidth > 20 && el.textContent.trim()) {
        out.clipped.push(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]} "${el.textContent.trim().slice(0,24)}" sw=${el.scrollWidth} cw=${el.clientWidth}`);
      }
    }
    // raw wei numbers (>= 15 digits in text)
    const walker = document.createTreeWalker(document.querySelector('.nb-app'), NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (/^\d{15,}$/.test(t) || /\d{15,}\.\d+/.test(t)) out.rawWei.push(t.slice(0, 30));
    }
    // tiny/low-contrast text
    for (const el of document.querySelectorAll('.nb-app *')) {
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (!t) { if (el.tagName === 'SPAN' || el.tagName === 'DIV') out.empty.push(`${el.tagName.toLowerCase()}.${el.className.toString().split(' ')[0]}`); continue; }
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs < 10) out.tinyText.push(`${fs}px "${t.slice(0, 20)}"`);
    }
    // fixed/absolute elements overlapping content at top
    for (const el of document.querySelectorAll('.nb-app [style*="position"], .topbar, .tape')) {
      const cs = getComputedStyle(el);
      if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height > 200) out.overlap.push(`tall ${cs.position}: ${el.className.toString().slice(0, 30)}`);
    }
    return out;
  });
  const compact = {};
  for (const k of Object.keys(issues)) { if (issues[k].length) compact[k] = [...new Set(issues[k])].slice(0, 6); }
  console.log(`\n===== ${p} =====`);
  console.log(JSON.stringify(compact, null, 1));
}
await browser.close();
