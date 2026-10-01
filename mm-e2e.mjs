/**
 * E2E MANUAL dengan MetaMask EXTENSION ASLI (tanpa inject buatan).
 * Tahap diketahui dari probe: unlock → add chain via site → connect (Injected) →
 * fund dari dev → buy NRWA (popup approve) → NFT mint → REPRODUKSI -32002 (popup pending,
 * reload, klik lagi) → bukti pesan friendly → recover.
 * Jalankan: cd web2 && timeout 570 node mm-e2e.mjs
 */
import { chromium } from 'playwright';
import { ethers } from 'ethers';
import fs from 'fs';

const RPC = 'https://robinhood-testnet.g.alchemy.com/v2/alch__6QV6bqRic9nBcIh_gIzI';
const DEV = '0x35F76E0d2D955beED6e3752F24b4c2570e481B04';
const TOKEN_PAGE = 'https://nabapu.vercel.app/token/0x67e891ebe485fd76060befb105d6a28e2ab46be0';
const NFT_PAGE = 'https://nabapu.vercel.app/nft';
const SHOT = 'E:/tmp/ui-audit/poles';
const PW = 'NabuTest!2026x#';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wallets = JSON.parse(fs.readFileSync('E:/builder/vibes/wallet/wallets.json', 'utf8'));
const devEntry = wallets.find((w) => (w.address || '').toLowerCase() === DEV.toLowerCase());
const network = new ethers.Network('robinhood-testnet', 46630);
const nodeProvider = new ethers.JsonRpcProvider(RPC, network, { staticNetwork: true, batchMaxSize: 1 });
const devWallet = new ethers.Wallet(devEntry.privateKey, nodeProvider);

let extId = null;
let stage = 'launch';
const shot = async (p, name) => {
  try { await p.screenshot({ path: `${SHOT}/${name}.png` }); console.log(`  📸 ${name}`); } catch {}
};
async function clickText(page, texts, timeout = 45000) {
  for (let i = 0; i < texts.length; i++) {
    const loc = page.locator(`button, a, [role="button"], [role="menuitem"], span, div`, { hasText: new RegExp(`^\\s*${texts[i]}\\s*$`, 'i') }).first();
    try { await loc.click({ timeout: i === 0 ? timeout : 3000 }); return texts[i]; } catch {}
  }
  throw new Error(`clickText gagal: ${texts.join(' | ')}`);
}
/** cari page MM (extension host) yang punya selector visible — MM suka buka tab home duplikat */
async function findMmPage(selector, timeout = 240000) {
  const t0 = Date.now();
  const rx = new RegExp(extId);
  while (Date.now() - t0 < timeout) {
    for (const p of ctx.pages()) {
      if (!rx.test(p.url())) continue;
      try {
        const loc = p.locator(selector).first();
        if ((await loc.count()) && (await loc.isVisible())) return p;
      } catch {}
    }
    await sleep(1500);
  }
  throw new Error(`page MM dengan '${selector}' gak ketemu dalam ${timeout / 1000}s`);
}
/** cari page approval (popup notification ATAU tab home yang lagi nampilin dialog) */
async function findApprovalPage(labels, timeout = 45000) {
  const t0 = Date.now();
  const rx = new RegExp(`${extId}|nkbihmogkjlhbfcccfkobjknlniajfo`);
  while (Date.now() - t0 < timeout) {
    for (const p of ctx.pages()) {
      if (p.url().includes('nabapu.vercel.app')) continue; // jangan sitenya
      try {
        for (const l of labels) {
          const b = p.locator(`button`, { hasText: new RegExp(`^\\s*${l}\\s*$`, 'i') }).first();
          if ((await b.count()) && (await b.isVisible())) {
            await p.bringToFront().catch(() => {});
            return { page: p, label: l };
          }
        }
      } catch {}
    }
    await sleep(800);
  }
  throw new Error(`approval page gak muncul (${labels.join('/')})`);
}
async function waitForMmPopup(timeout = 40000) {
  const r = await findApprovalPage(['Confirm', 'Approve', 'Connect', 'Next', 'Switch'], timeout);
  return r.page;
}
/** baca HTML page via CDP (aman dari LavaMoat MetaMask) */
async function htmlOf(p) {
  const cdp = await ctx.newCDPSession(p);
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const { outerHTML } = await cdp.send('DOM.getOuterHTML', { nodeId: doc.root.nodeId });
  await cdp.detach().catch(() => {});
  return outerHTML;
}
const mmTabs = () => ctx.pages().filter((p) => p.url().includes(extId));
const mRoute = (p) => p.url().split('#')[1] || '/';
const dump = () => console.log('tabs:', mmTabs().map(mRoute));
let srpWords = [];
/** approve semua langkah popup sampai hilang/selesai */
async function approvePopup(pop, labels = ['Confirm', 'Next', 'Approve', 'Sign', 'Connect']) {
  for (const l of labels) {
    try {
      const b = pop.locator(`button`, { hasText: new RegExp(`^\\s*${l}\\s*$`, 'i') }).first();
      await b.click({ timeout: 4000 });
      await sleep(900);
    } catch {}
  }
}

const ctx = await chromium.launchPersistentContext('E:/cloak-browser/profiles/mmtest/user-data', {
  executablePath: 'E:/ms-playwright/chromium-1228/chrome-win64/chrome.exe',
  headless: false,
  ignoreDefaultArgs: ['--disable-extensions'],
  args: ['--load-extension=E:/cloak-browser/extensions/metamask', '--no-first-run', '--no-default-browser-check'],
  viewport: { width: 1360, height: 920 },
});

try {
  stage = 'extension';
  for (let i = 0; i < 20 && !extId; i++) {
    const sw = ctx.serviceWorkers().find((w) => w.url().includes('chrome-extension://'));
    if (sw) extId = new URL(sw.url()).host; else await sleep(1000);
  }
  if (!extId) throw new Error('extension gak load');
  console.log('✓ extension:', extId);

  stage = 'unlock';
  // buka home kalau belum ada page extension
  if (!ctx.pages().some((p) => p.url().includes(extId))) {
    const t = await ctx.newPage();
    await t.goto(`chrome-extension://${extId}/home.html`);
  }
  // MM sering buka home duplikat → cari page yang beneran nampilin form unlock
  let mm = null;
  try {
    mm = await findMmPage('input[type="password"]', 90000);
    console.log('✓ form unlock ketemu di tab:', mm.url().slice(0, 70));
    const pwField = mm.locator('input[type="password"]').first();
    await pwField.click();
    await mm.keyboard.type(PW, { delay: 50 }); // fill() gak kebaca React MM — wajib keyboard
    await sleep(400);
    await mm.locator('button', { hasText: /^Unlock$/i }).first().click({ timeout: 15000 });
    console.log('✓ unlock dikirim');
    await sleep(6000);
  } catch {
    console.log('(gak ada form unlock — mungkin sudah terbuka)');
  }
  // onboarding belum kelar: masih ada step passkey di tab LAIN
  try {
    const pk = await findMmPage('[data-testid="passkey-maybe-later-button"]', 60000);
    await pk.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 10000 });
    console.log('✓ passkey step di-skip');
    await sleep(4000);
  } catch { console.log('(gak ada step passkey)'); }
  // sisa onboarding (kalau unlock balikin ke sini): review → reveal kata → quiz → completion
  for (let round = 0; round < 16; round++) {
    const onb = mmTabs().filter((p) => /#\/onboarding/i.test(p.url()));
    if (!onb.length) break;
    const passkey = mmTabs().find((p) => /setup-passkey/.test(p.url()));
    const review = mmTabs().find((p) => /review-recovery-phrase/.test(p.url()));
    const reveal = mmTabs().find((p) => /reveal-recovery-phrase/.test(p.url()));
    const confirm = mmTabs().find((p) => /confirm-recovery-phrase/.test(p.url()));
    const metrics = mmTabs().find((p) => /metametrics/.test(p.url()));
    const completion = mmTabs().find((p) => /\/onboarding\/completion/.test(p.url()));

    if (metrics) {
      for (const t of ['Continue', 'I agree', 'No thanks', 'Done']) {
        try { const b = metrics.locator(`button:has-text("${t}")`).first(); if (await b.count()) { await b.click({ timeout: 6000 }); console.log('→ metametrics:', t); break; } } catch {}
      }
      await sleep(6000); continue;
    }
    if (completion) {
      // halaman final — dump tombol, klik CTA terakhir yang enabled
      const n = await completion.locator('button').count();
      const info = [];
      for (let i = 0; i < Math.min(n, 12); i++) {
        const b = completion.locator('button').nth(i);
        info.push(`[${await b.getAttribute('data-testid') || '?'}]dis=${await b.isDisabled()}`);
      }
      console.log('completion buttons:', JSON.stringify(info));
      await completion.screenshot({ path: 'E:/tmp/ui-audit/poles/completion.png' });
      let clicked = false;
      for (const tid of ['onboarding-complete-done-button', 'completion-done', 'onboarding-completion-done']) {
        const b = completion.locator(`[data-testid="${tid}"]`);
        if (await b.count() && !(await b.isDisabled())) { await b.click({ timeout: 6000 }); console.log('→ completion click:', tid); clicked = true; break; }
      }
      if (!clicked) {
        // klik tombol enabled terakhir (bukan Back/Close)
        for (let i = n - 1; i >= 0; i--) {
          const b = completion.locator('button').nth(i);
          const txt = ((await b.innerText().catch(() => '')) || '').trim();
          if (/back|close/i.test(txt)) continue;
          if (await b.isDisabled()) continue;
          if (!txt) continue;
          await b.click({ timeout: 5000 }).catch(() => {});
          console.log('→ completion klik teks:', txt.slice(0, 30)); clicked = true; break;
        }
      }
      await sleep(7000); continue;
    }

    if (passkey) {
      await passkey.locator('[data-testid="passkey-maybe-later-button"]').click({ timeout: 15000 }).catch(() => {});
      console.log('→ passkey skip'); await sleep(7000); continue;
    }
    if (review) {
      // layar ini sudah MENAMPILKAN 12 kata (blur overlay "Tap to reveal") — baca dari HTML
      if (srpWords.length < 12) {
        await sleep(6000);
        const Hr = await htmlOf(review);
        fs.writeFileSync('E:/tmp/mm-review-viaUI.html', Hr);
        // GROUND TRUTH = atribut data-recovery-phrase (kata visible itu placeholder blur palsu!)
        const mDrp = Hr.match(/data-recovery-phrase="([^"]+)"/);
        if (mDrp && mDrp[1].split(':').length >= 12) {
          srpWords = mDrp[1].split(':').filter(Boolean);
          console.log('✓ 12 kata (dari atribut, mask:', srpWords.map((x) => x.slice(0, 2) + '**').join(',') + ')');
        } else console.log('data-recovery-phrase gak ketemu');
      }
      // tap-to-reveal: klik area phrase / overlay supaya continue aktif
      try {
        const tap = review.locator('text=/Tap to reveal/i').first();
        if (await tap.count()) { await tap.click({ timeout: 5000 }); console.log('→ tap reveal'); await sleep(1500); }
      } catch {}
      try { await review.locator('li').first().click({ timeout: 4000 }); } catch {}
      // poll tombol continue sampai enabled
      const cBtn = review.locator('[data-testid="recovery-phrase-continue"]');
      let enabled = false;
      for (let k = 0; k < 10 && !enabled; k++) {
        if (await cBtn.count() && !(await cBtn.isDisabled())) enabled = true;
        else await sleep(2000);
      }
      console.log('continue enabled?', enabled);
      if (enabled) {
        await cBtn.click({ timeout: 10000 });
        console.log('✓ review → lanjut (quiz)');
        await sleep(8000);
      } else {
        // fallback: remind-later mungkin melewati quiz (wallet tetap jadi)
        const rl = review.locator('[data-testid="recovery-phrase-remind-later"]');
        if (await rl.count() && !(await rl.isDisabled())) { await rl.click({ timeout: 6000 }); console.log('→ remind later (lewati quiz)'); await sleep(6000); }
      }
      continue;
    }
    if (reveal) {
      const f = reveal.locator('input[type="password"]').first();
      if (await f.count()) {
        await f.click(); await reveal.keyboard.type(PW, { delay: 50 }); await sleep(400);
        await reveal.locator('[data-testid*="continue"]').first().click({ timeout: 12000 }).catch(() => {});
        await sleep(8000);
      }
      const H = await htmlOf(reveal);
      const re = /<li[^>]*>\s*(?:<[^>]+>\s*)*([a-z]{3,12})\s*(?:<[^>]+>\s*)*<\/li>/gi;
      let m; const got = [];
      while ((m = re.exec(H)) && got.length < 30) got.push(m[1]);
      if (got.length >= 12) srpWords = got.slice(0, 12);
      console.log('reveal → kata:', srpWords.length, '| err:', (H.match(/Incorrect password/i) || [])[0] || 'none');
      await reveal.locator('[data-testid*="continue"]').first().click({ timeout: 8000 }).catch(() => {});
      await sleep(7000); continue;
    }
    if (confirm) {
      if (srpWords.length < 12) { console.log('quiz tanpa 12 kata — stop'); break; }
      console.log('→ QUIZ (isi 12 slot berurutan)');
      await sleep(5000);
      // simpan kondisi segar + daftar chip untuk diagnosis
      const H0 = await htmlOf(confirm);
      fs.writeFileSync('E:/tmp/mm-quiz-now.html', H0);
      // GROUND TRUTH quiz: data-quiz-words = posisi missing + jawabannya (urut index)
      let quizWords = [];
      const mQ = H0.match(/data-quiz-words="(\[[^\]]*\])"/);
      if (mQ) {
        try { quizWords = JSON.parse(mQ[1].replace(/&quot;/g, '"')).sort((a, b) => a.index - b.index); } catch (e) { console.log('parse quiz-words gagal:', e.message); }
      }
      if (!quizWords.length) {
        const mDrp2 = H0.match(/data-recovery-phrase="([^"]+)"/);
        console.log('fallback: quiz-words gak ada', mDrp2 ? '(phrase attr ada)' : '(phrase attr hilang!)');
      }
      console.log('missing words (urut slot):', JSON.stringify(quizWords));
      // klik chip sesuai urutan slot missing
      const listWords = quizWords.length ? quizWords.map((q) => q.word) : [];
      for (let k = 0; k < listWords.length; k++) {
        if (!/confirm-recovery-phrase/.test(confirm.url())) break;
        const target = listWords[k];
        const chip = confirm.locator('button', { hasText: new RegExp(`^\\s*${target}\\s*$`, 'i') }).first();
        try {
          await chip.click({ timeout: 7000 });
          console.log(`  ✓ chip '${target}' (${k + 1}/${listWords.length})`);
          await sleep(900);
        } catch {
          try { await chip.click({ timeout: 5000, force: true }); console.log(`  ✓ force '${target}'`); await sleep(900); }
          catch { console.log(`  ✗ chip '${target}' gak ketemu`); break; }
        }
      }
      // diagnosis: slots terisi gak?
      const Hafter = await htmlOf(confirm);
      fs.writeFileSync('E:/tmp/quiz-after.html', Hafter);
      const slotsAfter = [...Hafter.matchAll(/recovery-phrase-chip-(\d+)"[^>]*value="([^"]*)"/g)].map((x) => x[1] + '=' + x[2]);
      const bankAfter = [...Hafter.matchAll(/quiz-unanswered-\d+"[^>]*>\s*<span[^>]*>([^<]+)/g)].map((x) => x[1]);
      console.log('slots after:', slotsAfter.join(','));
      console.log('bank after:', JSON.stringify(bankAfter));
      await confirm.screenshot({ path: 'E:/tmp/ui-audit/poles/quiz-after-clicks.png' });
      // Confirm aktif setelah 12 slot penuh
      try {
        const cf = confirm.locator('button', { hasText: /^Confirm$/i }).first();
        for (let k = 0; k < 8; k++) {
          if (await cf.count() && !(await cf.isDisabled())) break;
          await sleep(1500);
        }
        if (await cf.count() && !(await cf.isDisabled())) { await cf.click({ timeout: 8000 }); console.log('  → Confirm diklik'); }
        else console.log('  Confirm masih disabled');
      } catch (e) { console.log('  confirm err:', e.message.slice(0, 80)); }
      await sleep(8000); dump(); continue;
    }
    // completion / route lain
    let clicked = false;
    for (const t of ['Done', 'Got it', 'All done', 'Get started', 'Continue']) {
      for (const tp of onb) {
        try { const b = tp.locator(`button:has-text("${t}")`).first(); if (await b.count()) { await b.click({ timeout: 5000 }); console.log('→ completion:', t); clicked = true; break; } } catch {}
      }
      if (clicked) break;
    }
    await sleep(5000);
    if (!clicked) { console.log('onboarding route tak dikenal:', onb.map(mRoute)); break; }
  }

  // home siap = tab non-onboarding DAN gak ada tab onboarding, stabil 3 cek
  let home = null;
  for (let k = 0; k < 45 && !home; k++) {
    const onb = mmTabs().filter((p) => /#\/onboarding/i.test(p.url()));
    const hs = mmTabs().filter((p) => !/#\/onboarding/i.test(p.url()));
    if (hs.length && !onb.length) {
      await sleep(9000);
      if (!mmTabs().some((p) => /#\/onboarding/i.test(p.url()))) home = hs[0];
    } else await sleep(2000);
  }
  console.log('tabs sekarang:', mmTabs().map(mRoute));
  if (!home) throw new Error('tab home gak ada (onboarding belum kelar)');
  console.log('✓ wallet siap:', mRoute(home));
  await shot(home, 'f0-home');

  // ---- SITE ----
  stage = 'site+network';
  const page = await ctx.newPage();
  await page.goto(TOKEN_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('button:has-text("Connect wallet")', { timeout: 60000 });
  console.log('✓ site terbuka');

  // fire dulu (jangan await — nunggu popup approval yang baru di-handle sesudahnya = deadlock)
  const addNetP = page
    .evaluate(async () => {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xB626', chainName: 'Robinhood Chain Testnet',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://robinhood-testnet.g.alchemy.com/v2/alch__6QV6bqRic9nBcIh_gIzI'],
          }],
        });
        return 'ok';
      } catch (e) { return String(e.message || e).slice(0, 160); }
    })
    .catch((e) => String(e).slice(0, 160));
  await sleep(3000);
  // handle approval popup
  try {
    const pop = await findApprovalPage(['Approve', 'Allow', 'Switch', 'Confirm', 'Next'], 25000);
    await shot(pop.page, 'f1-addnet');
    await approvePopup(pop.page, ['Approve', 'Allow', 'Switch network', 'Switch', 'Confirm']);
    await sleep(2000);
    console.log('✓ addNetwork popup di-approve');
  } catch (e) {
    console.log('  addNetwork popup:', e.message.slice(0, 80));
    console.log('  SEMUA PAGES:', ctx.pages().map((p) => p.url().slice(0, 110)));
    for (const p of ctx.pages()) {
      if (p.url().includes('nabapu')) continue;
      try {
        const n = await p.locator('button').count();
        const lbl = [];
        for (let i = 0; i < Math.min(n, 10); i++) { const b = p.locator('button').nth(i); lbl.push(`[${await b.getAttribute('data-testid') || ((await b.innerText().catch(() => '')) || '').trim().slice(0, 20)}]`); }
        console.log('  page', p.url().slice(-40), 'btn:', JSON.stringify(lbl));
      } catch {}
    }
  }
  const addNet = await Promise.race([addNetP, sleep(10000).then(() => 'menunggu-lama')]);
  console.log('  addNetwork result:', addNet);
  await sleep(1000);

  stage = 'connect';
  await page.click('button:has-text("Connect wallet")');
  await sleep(1800);
  await shot(page, 'f2-chooser');
  try { await page.locator('button, [role="menuitem"], [role="option"]', { hasText: 'Injected' }).first().click({ timeout: 8000 }); } catch {}
  try {
    const pop = await waitForMmPopup(30000);
    await shot(pop, 'f3-connect');
    await approvePopup(pop, ['Next', 'Connect', 'Allow', 'Confirm']);
    await sleep(2500);
    console.log('✓ connect popup di-approve');
  } catch (e) { console.log('  connect popup:', e.message); }
  await page.waitForSelector('button:has-text("Buy")', { timeout: 40000 });
  console.log('✓ terhubung (tab Buy/Sell)');

  stage = 'fund';
  const mmAddr = await page.evaluate(async () => {
    const a = await window.ethereum.request({ method: 'eth_accounts' });
    return a[0];
  });
  console.log('✓ alamat MM:', mmAddr);
  const bal = await nodeProvider.getBalance(mmAddr);
  if (bal < ethers.parseEther('0.004')) {
    const t = await devWallet.sendTransaction({ to: mmAddr, value: ethers.parseEther('0.01') });
    await t.wait(1);
    console.log('✓ kirim 0.01 ETH → MM:', t.hash.slice(0, 20) + '…');
  } else console.log('✓ saldo MM cukup:', ethers.formatEther(bal));
  await sleep(4000);

  stage = 'buy normal';
  await page.fill('input[placeholder="ETH to spend"]', '0.0001');
  await page.waitForFunction(() => document.body.innerText.includes('for 0.0001 ETH'), { timeout: 40000 });
  console.log('✓ quote tampil');
  await page.click('button:has-text("Buy $NRWA")');
  const pop1 = await waitForMmPopup(40000);
  await shot(pop1, 'f4-buy');
  await approvePopup(pop1, ['Confirm', 'Next', 'Approve']);
  await page.waitForFunction(() => /✓ tx 0x/.test(document.body.innerText), { timeout: 120000 });
  const buyTx = (await page.evaluate(() => document.body.innerText)).match(/✓ tx (0x[0-9a-f]+)/)[1];
  console.log('✓ BUY SUKSES dengan MetaMask ASLI:', buyTx);
  await shot(page, 'f5-buy-ok');

  stage = 'nft mint';
  await page.goto(NFT_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('button:has-text("Mint free")', { timeout: 60000 });
  await page.click('button:has-text("Mint free")');
  try {
    const pop2 = await waitForMmPopup(40000);
    await shot(pop2, 'f6-mint');
    await approvePopup(pop2, ['Confirm', 'Next', 'Approve']);
  } catch (e) { console.log('  mint popup:', e.message); }
  await page.waitForFunction(() => document.body.innerText.includes('Minted!'), { timeout: 120000 });
  console.log('✓ NFT MINT SUKSES dengan MetaMask ASLI');
  await shot(page, 'f7-mint-ok');

  stage = 'repro -32002';
  await page.goto(TOKEN_PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[placeholder="ETH to spend"]', { timeout: 60000 });
  await page.fill('input[placeholder="ETH to spend"]', '0.0001');
  await page.waitForFunction(() => document.body.innerText.includes('for 0.0001 ETH'), { timeout: 40000 });
  await page.click('button:has-text("Buy $NRWA")');
  const popStuck = await waitForMmPopup(40000); // DIBIARKAN terbuka (pending)
  await shot(popStuck, 'f8-stuck-popup');
  console.log('✓ popup pending sengaja dibuka');
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input[placeholder="ETH to spend"]', { timeout: 60000 });
  await page.fill('input[placeholder="ETH to spend"]', '0.0001');
  await page.waitForFunction(() => document.body.innerText.includes('for 0.0001 ETH'), { timeout: 40000 });
  await page.click('button:has-text("Buy $NRWA")');
  await sleep(7000);
  const errText = await page.evaluate(() => {
    const els = [...document.querySelectorAll('div')].filter((d) => (d.className || '').toString().includes('destructive') && d.textContent.length > 15);
    return els.length ? els[els.length - 1].textContent : null;
  }).catch(() => null);
  console.log('=== ERROR DI HALAMAN (bundle baru) ===');
  console.log(errText || '(box error gak ketemu)');
  await shot(page, 'f9-repro');

  stage = 'recover';
  try { await popStuck.locator('button', { hasText: /^Reject$/i }).first().click({ timeout: 6000 }); console.log('✓ pending di-reject'); } catch { console.log('  (popup udah gak ada)'); }
  await sleep(2500);
  await page.click('button:has-text("Buy $NRWA")');
  try {
    const pop3 = await waitForMmPopup(30000);
    await approvePopup(pop3, ['Confirm', 'Next']);
    await page.waitForFunction(() => /✓ tx 0x/.test(document.body.innerText), { timeout: 120000 });
    console.log('✓ RECOVER: buy sukses setelah pending dibersihkan');
    await shot(page, 'f10-recover-ok');
  } catch (e) { console.log('  recover:', e.message.slice(0, 160)); }

  console.log('\n=== SELESAI ===');
} catch (e) {
  console.log(`\n✗ GAGAL [${stage}]:`, (e.message || String(e)).slice(0, 300));
  const pages = ctx.pages();
  const cur = pages[pages.length - 1];
  if (cur) await shot(cur, `fail-${stage.replace(/\W+/g, '-')}`);
} finally {
  await ctx.close();
}
