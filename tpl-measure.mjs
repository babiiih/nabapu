import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
await p.goto('http://localhost:8771/index.html', { waitUntil: 'load', timeout: 30000 }).catch(() => {});
await p.waitForTimeout(2000);
const m = await p.evaluate(() => {
  const pick = (sel, props) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const o = {};
    for (const pr of props) o[pr] = cs[pr];
    return o;
  };
  const P = ['backgroundColor', 'color', 'borderColor', 'borderTopColor'];
  const out = {
    shell: pick('.shell', P),
    workspaceMain: pick('.workspace main', P),
    hero: pick('.hero', P),
    heroH1: pick('.hero h1', ['color', 'fontSize']),
    heroSpan: pick('.hero h1 span', ['color']),
    btn: pick('.hero .btn', P),
    btnPrimary: pick('.hero .btn.primary', P),
    statCard: pick('.stat-card', P),
    statCardStrong: pick('.stat-card strong', ['color', 'fontSize']),
    sectionHeadH2: pick('.section-head h2', ['color']),
    tokenCard: pick('.token-card', P),
    tokenNameB: pick('.token-name b', ['color']),
    table: pick('table', P),
    th: pick('th', P),
    td: pick('td', ['color', 'backgroundColor']),
    tabsBtnActive: pick('.tabs button.active', P),
    filterInput: pick('.filter-input', P),
    eyebrow: pick('.eyebrow', ['color']),
    pageHeadingH1: pick('.page-heading h1', ['color']),
    appFooter: pick('.app-footer', P),
    tape: pick('.market-tape', P),
    screenRowTd: pick('.screener-table td', ['color']),
  };
  return out;
});
console.log(JSON.stringify(m, null, 1));
await b.close();
