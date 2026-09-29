import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await m.waitForTimeout(6000);
const t = await m.$('[data-sidebar="trigger"], button[aria-label*="Sidebar" i]');
if (t) { await t.click(); await m.waitForTimeout(1000); }

const info = await m.evaluate(() => {
  const els = [];
  document.querySelectorAll('[data-state="open"]').forEach(el => {
    const cs = getComputedStyle(el);
    els.push({
      tag: el.tagName,
      hasBgSidebar: el.className.includes('bg-sidebar'),
      cls: el.className,
      bg: cs.backgroundColor,
      w: Math.round(el.getBoundingClientRect().width),
      resolvedSidebar: getComputedStyle(document.documentElement).getPropertyValue('--sidebar'),
      resolvedBg: getComputedStyle(document.documentElement).getPropertyValue('--background'),
      bgImage: cs.backgroundImage.slice(0, 50),
      backdrop: cs.backdropFilter.slice(0, 40),
    });
  });
  // apakah utility .bg-sidebar ada di stylesheet?
  let ruleFound = 'n/a';
  try {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules } catch { continue }
      for (const r of rules) {
        if (r.selectorText && r.selectorText.includes('.bg-sidebar') && !r.selectorText.includes('sidebar-')) { ruleFound = r.cssText.slice(0, 120); break }
      }
      if (ruleFound !== 'n/a') break;
    }
  } catch (e) { ruleFound = 'err ' + e.message }
  return { els, ruleFound };
});
console.log(JSON.stringify(info, null, 1));
await b.close();
