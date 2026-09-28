const { chromium } = require('playwright')
const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
;(async () => {
  const b = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const p = await b.newPage()
  const bad = []
  p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().slice(0, 110)) })
  await p.goto('https://nabapu-app.vercel.app/token/' + TA, { waitUntil: 'networkidle', timeout: 45000 })
  await p.waitForTimeout(2500)
  console.log('bad-responses:')
  bad.forEach(x => console.log('  ' + x))
  await b.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
