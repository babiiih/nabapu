import { chromium } from 'playwright';
const BASE = 'https://nabapu.vercel.app';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', e => errs.push(String(e).slice(0, 120)));

await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(7000);
const home = await p.evaluate(() => ({
  title: document.title,
  featured: !!document.querySelector('a[href*="/token/0x67e891"]'),
  sidebar: [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')).filter(h => ['/trending','/trenches','/wallet','/nft'].includes(h)),
}));

await p.goto(`${BASE}/nft`, { waitUntil: 'domcontentloaded', timeout: 40000 });
await p.waitForTimeout(7000);
const nft = await p.evaluate(async () => {
  const img = await fetch('/nft/NFT_0580_Epic.jpg');
  const man = await fetch('/nft/manifest.json');
  const meta = await (await fetch('/nft/580.json')).json();
  return {
    h1: document.querySelector('h1')?.textContent,
    counter: [...document.querySelectorAll('div')].map(d => d.textContent).find(t => t && /^\d+ \/ 1000$/.test(t.trim())),
    gallery: document.querySelectorAll('a[href*="/nft/NFT_"] img').length,
    jpg: img.status, manifest: (await man.json()).length,
    metaImageHost: meta.image.split('/')[2],
  };
});
console.log(JSON.stringify({ home, nft, errors: errs.length ? errs : 'none' }, null, 1));
await p.screenshot({ path: 'E:/tmp/ui-audit/poles/nabapu-domain.png' });
await b.close();
