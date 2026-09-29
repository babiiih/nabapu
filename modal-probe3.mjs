import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await m.waitForTimeout(7000);

// 1. computed background drawer mobile (buka via trigger)
const trigger = await m.$('[data-sidebar="trigger"], button[aria-label*="Sidebar" i]');
console.log('trigger found:', !!trigger);
if (trigger) { await trigger.click(); await m.waitForTimeout(1000); }

const panel = await m.evaluate(() => {
  const el = document.querySelector('[data-sidebar="mobile"], [data-sidebar="offcanvas"], [data-state="open"][class*="fixed z-50"]');
  if (!el) return { found: false };
  const cs = getComputedStyle(el);
  return { found: true, cls: el.className.slice(0, 160), bg: cs.backgroundColor, bgImage: cs.backgroundImage.slice(0, 60), opacity: cs.opacity, w: el.getBoundingClientRect().width };
});
console.log('DRAWER PANEL:', JSON.stringify(panel, null, 1));
await m.screenshot({ path: 'E:/tmp/ui-audit/poles/t-mobile-drawer2.png' });

// tutup drawer
await m.keyboard.press('Escape');
await m.waitForTimeout(800);

// 2. badge NEW vs card overlap (mobile)
const badges = await m.evaluate(() => {
  return [...document.querySelectorAll('.token-card')].slice(0, 3).map(card => {
    const cr = card.getBoundingClientRect();
    const badge = card.querySelector('.chip.is-live');
    if (!badge) return null;
    const br = badge.getBoundingClientRect();
    return {
      card: { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width) },
      badge: { x: Math.round(br.x), y: Math.round(br.y), w: Math.round(br.width) },
      overflowsRight: Math.round(br.right - cr.right),
      overflowsTop: Math.round(cr.top - br.top),
      text: badge.textContent,
    };
  });
});
console.log('BADGES:', JSON.stringify(badges, null, 1));

// 3. elemen yang keluar viewport horizontal (overflow) di mobile
const overflow = await m.evaluate(() => {
  const w = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('main *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > w + 2 || r.left < -2)) {
      out.push({ tag: el.tagName, cls: (el.className + '').slice(0, 70), left: Math.round(r.left), right: Math.round(r.right) });
    }
  });
  return out.slice(0, 12);
});
console.log('H-OVERFLOW:', JSON.stringify(overflow, null, 1));
await b.close();
