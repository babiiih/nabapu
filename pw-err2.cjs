const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage()
  const errs = []
  p.on('pageerror', e => errs.push(String(e.message).slice(0,110)))
  p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text().slice(0,110)) })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(3000)
  console.log('has-Price-movement:', (await p.content()).includes('Price movement'))
  console.log('has-Trade-history:', (await p.content()).includes('Trade history'))
  console.log('errors:', errs.length ? errs : 'none')
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
