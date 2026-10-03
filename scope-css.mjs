// Scope CSS template nabapu-ui ke .nb-app tanpa dependency eksternal.
// Aturan: prefix setiap top-level selector dengan ".nb-app " kecuali:
// - keyframes inner rules
// - :root → .nb-app
// - html/body → .nb-app
// - `*` → .nb-app
// - url(...) / @import jangan discope
import fs from 'fs';
import path from 'path';

const dir = 'src/styles/nabapu-ui';
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.css') && f !== 'nabapu-ui.css');

let totalSel = 0;
const GLOBAL_TAGS = new Set([
  'main', 'table', 'th', 'td', 'button', 'a', 'input', 'code',
  'span', 'strong', 'small', 'b', 'em', 'i', 'img', 'time', 'div', 'section',
  'aside', 'header', 'footer', 'nav', 'article', 'p', 'h1', 'h2', 'h3', 'h4',
  'label', 'form', 'kbd', 'svg', 'circle', 'rect', 'path', 'symbol', 'use',
]);

function skipTokens(css, j, stop) {
  // majukan j melewati comment / url(...) / string, berhenti di char `stop`
  while (j < css.length && !stop.includes(css[j])) {
    if (css.startsWith('/*', j)) {
      const end = css.indexOf('*/', j + 2);
      j = end === -1 ? css.length : end + 2;
    } else if (css.startsWith('url(', j)) {
      let d = 1;
      j += 4;
      while (j < css.length && d > 0) {
        if (css[j] === '(') d++;
        else if (css[j] === ')') d--;
        j++;
      }
    } else if (css[j] === '"' || css[j] === "'") {
      const q = css[j];
      j++;
      while (j < css.length && css[j] !== q) j++;
      j++;
    } else {
      j++;
    }
  }
  return j;
}

function scopeOne(sel) {
  const s = sel.trim();
  if (!s) return s;
  if (s === ':root') return '.nb-app';
  if (/^\.nb-app/.test(s) || s === 'html' || s === 'body') return '.nb-app';
  if (s === '*') return '.nb-app';
  if (/^url\(/.test(s)) return s;

  return s
    .split(',')
    .map((part) => {
      const t = part.trim();
      if (!t) return t;
      if (/^\.nb-app/.test(t)) return t;
      const firstTok = t.split(/\s+|>|\+|~|\[|:|\./)[0];
      if (GLOBAL_TAGS.has(firstTok.toLowerCase())) return '.nb-app ' + t;
      return '.nb-app ' + t;
    })
    .join(', ');
}

for (const f of files) {
  const p = path.join(dir, f);
  const css = fs.readFileSync(p, 'utf8');
  const out = [];
  const atRuleStack = [];
  let pos = 0;

  while (pos < css.length) {
    if (css.startsWith('/*', pos)) {
      const end = css.indexOf('*/', pos + 2);
      const seg = end === -1 ? css.slice(pos) : css.slice(pos, end + 2);
      out.push(seg);
      pos = end === -1 ? css.length : end + 2;
      continue;
    }
    const ch = css[pos];
    if (ch === '@') {
      const j = skipTokens(css, pos, ['{', ';']);
      const header = css.slice(pos, j);
      out.push(header);
      pos = j;
      if (pos < css.length && css[pos] === '{') {
        out.push('{');
        pos++;
        atRuleStack.push(header.trim().split(/\s/)[0]);
        continue;
      }
      out.push(';');
      pos++;
      continue;
    }
    if (ch === '}') {
      out.push('}');
      pos++;
      atRuleStack.pop();
      continue;
    }
    const j = skipTokens(css, pos, ['{', '}']);
    let sel = css.slice(pos, j).trim();
    pos = j;
    if (pos < css.length && css[pos] === '{') {
      const top = atRuleStack[atRuleStack.length - 1];
      const isKeyframes = top && /keyframes$/i.test(top);
      if (!isKeyframes && sel) {
        sel = scopeOne(sel);
        totalSel++;
      }
      out.push(sel);
      out.push('{');
      pos++;
    } else {
      out.push(sel);
    }
  }

  fs.writeFileSync(p, out.join(''));
  console.log('scoped', f);
}
console.log('total selectors scoped:', totalSel);
