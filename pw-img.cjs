const { chromium } = require('playwright')

;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage({ viewport: { width: 1440, height: 2200 } })
  await p.goto('https://nabapu-app.vercel.app/market', { waitUntil: 'networkidle', timeout: 45000 })
  // wait until at least one image settles
  await p.waitForFunction(() => {
    const imgs = [...document.querySelectorAll('.token-card img')]
    return imgs.length > 0 && imgs.every(i => i.complete)
  }, { timeout: 30000 }).catch(() => {})
  const r = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('.token-card img')]
    return imgs.map(i => ({
      src: (i.getAttribute('src') || '').slice(0, 60),
      ok: i.complete && i.naturalWidth > 0,
      fb: i.getAttribute('data-fallback')
    }))
  })
  console.log('total:', r.length)
  console.log('ok:', r.filter(x => x.ok).length)
  console.log('fallback:', r.filter(x => x.fb === '1').length)
  console.log('sample-src:', r.slice(0, 2).map(x => x.src))
  console.log('sample-broken:', r.filter(x => !x.ok).slice(0, 2).map(x => x.src))
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
