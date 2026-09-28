const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage({ viewport: { width: 1440, height: 2200 } })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(3000)
  await p.screenshot({ path: 'E:/e/tmp/shot/audit-token.png' })
  await p.goto('https://nabapu-app.vercel.app/market', { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(2500)
  await p.screenshot({ path: 'E:/e/tmp/shot/audit-mkt.png' })
  await b.close()
  console.log('shots taken')
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
