const { chromium } = require('playwright')

const TA = '0x67e891ebe485fd76060befb105d6a28e2ab46be0'
const BASE = 'https://nabapu-app.vercel.app'

;(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome', args: ['--no-sandbox'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1600 } })
  const errors = []
  page.on('pageerror', (e) => { if (!/path.endsWith/.test(String(e.message))) errors.push(String(e.message).slice(0, 90)) })

  const check = async (name, url, fn) => {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 })
      await page.waitForTimeout(2500)
      const r = await fn(page)
      console.log(`${name}: ${r}`)
    } catch (e) {
      console.log(`${name}: FAIL ${String(e.message).slice(0, 70)}`)
    }
  }

  await check('dashboard', `${BASE}/`, async (p) => {
    return (await p.content()).includes('Recent launches') ? 'ok' : 'no content'
  })

  await check('market', `${BASE}/market`, async (p) => {
    const n = await p.locator('.token-card').count()
    return `${n} cards`
  })

  await check('token-page', `${BASE}/token/${TA}`, async (p) => {
    const html = await p.content()
    return [
      'chart=' + html.includes('Price movement'),
      'log=' + html.includes('Trade history'),
      'tradebox=' + html.includes('Trade'),
    ].join(' ')
  })

  await check('profile', `${BASE}/profile`, async (p) => {
    const html = await p.content()
    return html.includes('Connect wallet') ? 'ok (disconnected state)' : 'unknown'
  })

  console.log('page-errors:', errors.length ? errors : 'none')
  await browser.close()
})().catch((e) => { console.log('FAIL', e.message); process.exit(1) })
