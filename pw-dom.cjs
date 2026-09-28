const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'

;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage({ viewport: { width: 1440, height: 2200 } })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(3000)

  const html = await p.content()
  console.log('candles-point-label:', (html.match(/(\d+) points · ([a-z ]+) · ETH per token/) || ['none'])[0])
  console.log('feed-rows:', await p.locator('.feed-row').count())
  console.log('canvas-drawn:', await p.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return 'no canvas'
    const ctx = c.getContext('2d')
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let colored = 0
    for (let i = 0; i < d.length; i += 12) {
      if (Math.abs(d[i]-d[i+1]) > 25 || Math.abs(d[i+1]-d[i+2]) > 25) colored++
    }
    return colored + ' colored px'
  }))
  console.log('img-loaded:', await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')]
    return imgs.length + ' imgs, ' + imgs.filter(i => i.complete && i.naturalWidth > 0).length + ' ok'
  }))

  // market page image check
  await p.goto('https://nabapu-app.vercel.app/market', { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(2500)
  console.log('market-imgs:', await p.evaluate(() => {
    const imgs = [...document.querySelectorAll('.token-card img')]
    return imgs.length + ' imgs, ' + imgs.filter(i => i.complete && i.naturalWidth > 0).length + ' loaded'
  }))
  console.log('fallback-monograms:', await p.evaluate(() =>
    document.querySelectorAll('.token-card img[data-fallback="1"]').length))
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
