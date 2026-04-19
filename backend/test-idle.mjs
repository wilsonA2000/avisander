import { chromium } from 'playwright'

const browser = await chromium.launch({
  executablePath: '/home/wilsonadmin/.local/bin/google-chrome',
  args: ['--no-sandbox', '--disable-gpu']
})
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })

// Cerrar modal
try {
  const closeX = page.locator('[class*="fixed"] button').first()
  await closeX.click({ timeout: 3000 })
} catch {}
await page.waitForTimeout(500)
await page.evaluate(() => {
  document.querySelectorAll('[class*="fixed"][class*="inset"]').forEach(el => el.remove())
})

// Screenshot del logo agrandado
await page.screenshot({ path: '/tmp/idle-0-logo.png', fullPage: false })

// Mover cursor al centro y dejarlo quieto
await page.mouse.move(640, 400)
await page.waitForTimeout(1000)
await page.screenshot({ path: '/tmp/idle-1-before.png', fullPage: false })

// Esperar 5.5 segundos para que aparezca el pet
console.log('Esperando idle...')
await page.waitForTimeout(5500)
await page.screenshot({ path: '/tmp/idle-2-pet.png', fullPage: false })

// Mover cursor — debería desaparecer
await page.mouse.move(700, 300)
await page.waitForTimeout(500)
await page.screenshot({ path: '/tmp/idle-3-gone.png', fullPage: false })

// Dejar quieto de nuevo
await page.waitForTimeout(5500)
await page.screenshot({ path: '/tmp/idle-4-pet2.png', fullPage: false })

await browser.close()
console.log('Done')
