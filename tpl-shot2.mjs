import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.goto('http://localhost:8771/index.html', { waitUntil: 'load', timeout: 30000 }).catch(e => console.log('nav err', e.message));
await p.waitForTimeout(2500);
await p.screenshot({ path: 'E:/tmp/ui-audit/tpl-ref.png' });
const bg = await p.evaluate(() => {
  const sb = document.querySelector('.sidebar');
  const hero = document.querySelector('.hero');
  return {
    body: getComputedStyle(document.body).backgroundColor,
    sidebar: sb ? getComputedStyle(sb).backgroundColor : null,
    hero: hero ? getComputedStyle(hero).backgroundColor : null,
  };
});
console.log(JSON.stringify(bg));
await b.close();
