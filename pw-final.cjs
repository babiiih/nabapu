const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const ctx = await b.newContext({ bypassCSP: true })
  const p = await ctx.newPage()
  const bad = []
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status()+' '+r.url().slice(0,90)) })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA + '?cb=' + Date.now(), { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(4000)
  console.log('canvas:', await p.locator('canvas').count())
  console.log('no-history-msg:', (await p.content()).includes('No price history yet'))
  console.log('canvas-px:', await p.evaluate(() => {
    const c = document.querySelector('canvas')
    if (!c) return 'none'
    const ctx2 = c.getContext('2d')
    const d = ctx2.getImageData(0, 0, c.width, c.height).data
    let col = 0
    for (let i = 0; i < d.length; i += 12)
      if (Math.abs(d[i]-d[i+1]) > 25 || Math.abs(d[i+1]-d[i+2]) > 25) col++
    return col
  }))
  console.log('feed-rows:', await p.locator('.feed-row').count())
  console.log('bad:', bad)
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
