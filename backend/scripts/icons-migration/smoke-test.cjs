const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(e.message));
  p.on('console', m => { if (m.type() === 'error' && !m.text().includes('404')) errors.push('[console] ' + m.text()); });

  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/e2e-screenshots/smoke-home.png', fullPage: false });

  await p.goto('http://localhost:5173/producto/1', { waitUntil: 'networkidle' });
  await p.waitForTimeout(2000);
  await p.screenshot({ path: '/tmp/e2e-screenshots/smoke-detalle.png', fullPage: false });

  await p.goto('http://localhost:5173/carrito', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: '/tmp/e2e-screenshots/smoke-carrito.png', fullPage: false });

  console.log('Page errors (no-404):', errors.length);
  errors.slice(0, 5).forEach(e => console.log('  -', e.substring(0, 140)));
  await b.close();
})().catch(e => { console.error(e.message); process.exit(1); });
