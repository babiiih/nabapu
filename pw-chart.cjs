const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage({ viewport: { width: 1440, height: 2200 } })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(3500)
  console.log('header:', await p.locator('text=ETH per token').count())
  console.log('canvas:', await p.locator('canvas').count())
  console.log('canvas-drawn:', await p.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return 'none'
    const ctx = c.getContext('2d')
    const d = ctx.getImageData(0, 0, c.width, c.height).data
    let col = 0
    for (let i = 0; i < d.length; i += 12)
      if (Math.abs(d[i]-d[i+1]) > 25 || Math.abs(d[i+1]-d[i+2]) > 25) col++
    return col + ' px'
  }))
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
