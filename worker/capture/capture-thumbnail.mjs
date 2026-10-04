// Capture d'écran d'un site publié, exécutée dans un conteneur Playwright jetable.
// Usage : node capture-thumbnail.mjs <url> <fichier.jpg>
// Petite image (640×400, JPEG compressé) : elle ne pèse que quelques dizaines de Ko
import { chromium } from 'playwright-core'

const [url, output] = process.argv.slice(2)
if (!url || !output) {
  console.error('usage: capture-thumbnail.mjs <url> <output.jpg>')
  process.exit(2)
}

const browser = await chromium.launch({ args: ['--no-sandbox'] })
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 400 }, deviceScaleFactor: 1 })
  await page.goto(url, { waitUntil: 'load', timeout: 30000 })
  await page.waitForTimeout(1000)
  await page.screenshot({ path: output, type: 'jpeg', quality: 60 })
} finally {
  await browser.close()
}
