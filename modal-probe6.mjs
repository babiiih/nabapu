import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
// intercept network css
const cssUrls = [];
m.on('response', r => { if (r.url().endsWith('.css')) cssUrls.push({ url: r.url().slice(-50), status: r.status(), fromCache: r.fromServiceWorker?.() }); });
await m.goto(`${BASE}/trenches`, { waitUntil: 'networkidle', timeout: 40000 }).catch(() => {});
await m.waitForTimeout(3000);

const out = await m.evaluate(() => {
  const found = [];
  function walk(rules, path) {
    for (const rule of rules) {
      if (rule.selectorText && rule.selectorText.includes('.bg-sidebar') && !rule.selectorText.includes('sidebar-')) {
        found.push({ path, sel: rule.selectorText.slice(0, 100), css: rule.cssText.slice(0, 150) });
      }
      if (rule.cssRules) walk(rule.cssRules, path + '>' + (rule.cssText.slice(0, 30)));
    }
  }
  const sheets = [...document.styleSheets].map(sh => {
    try { walk(sh.cssRules, sh.href ? sh.href.slice(-30) : 'inline'); return { href: sh.href?.slice(-40), n: sh.cssRules.length } }
    catch (e) { return { href: sh.href?.slice(-40), err: e.message } }
  });
  // tes div yang benar
  const d = document.createElement('div');
  d.className = 'bg-sidebar';
  document.body.appendChild(d);
  const test = {
    matches: d.matches('.bg-sidebar'),
    bg: getComputedStyle(d).backgroundColor,
    applied: [...d.style].join(','), // inline (harus kosong)
  };
  d.remove();
  return { found, sheets, test };
});
console.log('CSS URLs:', JSON.stringify(cssUrls));
console.log(JSON.stringify(out, null, 1));
await b.close();
