import { chromium } from 'playwright';
const BASE = 'https://web2-one-red.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });

// MOBILE
const m = await b.newPage({ viewport: { width: 390, height: 844 } });
await m.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await m.waitForTimeout(7000);
await m.screenshot({ path: 'E:/tmp/ui-audit/poles/t-mobile.png' });
// buka sidebar mobile (hamburger / Toggle Sidebar)
const tog = await m.$('[aria-label*="Sidebar" i], button:has-text("Toggle Sidebar"), [data-sidebar="trigger"]');
if (tog) { await tog.click(); await m.waitForTimeout(1200); await m.screenshot({ path: 'E:/tmp/ui-audit/poles/t-mobile-sidebar.png' }); }
console.log('mobile dialogs:', JSON.stringify(await m.evaluate(() => {
  const out = [];
  document.querySelectorAll('[role="dialog"], dialog, [data-state="open"]').forEach(el => {
    const r = el.getBoundingClientRect();
    out.push({ tag: el.tagName, cls: (el.className + '').slice(0, 90), w: Math.round(r.width), h: Math.round(r.height), visible: r.width > 0 && r.height > 0, text: el.textContent?.slice(0, 120) });
  });
  return out;
}), null, 1));

// DESKTOP — klik tombol2 utama, cari popup
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(`${BASE}/trenches`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(6000);
// klik avatar NB (dropdown?), toggle theme, connect wallet
for (const [name, sel] of [['avatar', 'button:has([class*="avatar" i]), header button.rounded-full'], ['connect', 'button:has-text("Connect wallet")'], ['sidebarSwitch', 'button:has-text("Nabapu")']]) {
  try {
    const el = await p.$(sel);
    if (el) {
      await el.click({ timeout: 3000 }).catch(() => {});
      await p.waitForTimeout(900);
      const d = await p.evaluate(() => {
        const out = [];
        document.querySelectorAll('[role="menu"], [role="dialog"], [data-radix-popper-content-wrapper], [data-state="open"]').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.width > 0) out.push({ tag: el.tagName, cls: (el.className + '').slice(0, 80), w: Math.round(r.width), h: Math.round(r.height), text: el.textContent?.slice(0, 100) });
        });
        return out;
      });
      console.log(`after ${name} click:`, JSON.stringify(d));
      if (d.length) await p.screenshot({ path: `E:/tmp/ui-audit/poles/t-click-${name}.png` });
      await p.keyboard.press('Escape');
      await p.waitForTimeout(500);
    } else console.log(`${name}: not found`);
  } catch (e) { console.log(`${name}: ${e.message.slice(0, 80)}`); }
}
await b.close();
