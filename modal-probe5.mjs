import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await m.waitForTimeout(6000);
const t = await m.$('[data-sidebar="trigger"], button[aria-label*="Sidebar" i]');
if (t) { await t.click(); await m.waitForTimeout(1000); }

const r = await m.evaluate(() => {
  const panel = document.querySelector('[data-state="open"][class*="bg-sidebar"]');
  if (!panel) return { panel: false };
  const cs = getComputedStyle(panel);
  // 1. element-level var
  const vSidebar = cs.getPropertyValue('--sidebar');
  const vBg = cs.getPropertyValue('--background');
  // 2. elemen test pakai class bg-sidebar
  const d = document.createElement('div');
  d.className = 'bg-sidebar';
  document.body.appendChild(d);
  const dBg = getComputedStyle(d).backgroundColor;
  d.remove();
  // 3. semua rule yang match panel & set background-color
  const matching = [];
  for (const sh of document.styleSheets) {
    let rules; try { rules = sh.cssRules } catch { continue }
    for (const rule of rules) {
      if (!rule.selectorText) continue;
      try {
        if (panel.matches(rule.selectorText) && /background(-color)?\s*:/.test(rule.cssText)) {
          matching.push(rule.cssText.slice(0, 180));
        }
      } catch {}
    }
  }
  return {
    panel: true,
    vSidebar, vBg, dBg,
    inlineStyle: panel.getAttribute('style'),
    bgProp: cs.backgroundColor,
    matching,
  };
});
console.log(JSON.stringify(r, null, 1));
await b.close();
