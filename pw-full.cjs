const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage()
  const errs = []
  p.on('pageerror', e => errs.push('PAGE: '+String(e.message).slice(0,120)))
  p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,120)) })
  const bad = []
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status()+' '+r.url().slice(0,100)) })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(3500)
  console.log('canvas:', await p.locator('canvas').count())
  console.log('Price-movement:', (await p.content()).includes('Price movement'))
  console.log('Loading-chart:', (await p.content()).includes('Loading chart'))
  console.log('No-price-history:', (await p.content()).includes('No price history yet'))
  console.log('bad:', bad)
  console.log('errors:', errs)
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
