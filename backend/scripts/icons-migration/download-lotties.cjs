// Descarga 12 animaciones Lottie gratuitas (CDN público de LottieFiles)
// a backend/media/lotties/<slug>.json
//
// IDs seleccionados manualmente del catálogo gratuito de lottiefiles.com,
// curados para encajar en estados/sentimientos de Avisander.

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, 'media', 'lotties');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Cada slug → ID lottiefiles. URL: https://assets{N}.lottiefiles.com/packages/<id>.json
// (probamos servers 1..10 hasta dar con uno que responda 200)
const LOTTIES = {
  'loading':        'lf20_usmfx6bp',     // spinner minimal
  'success':        'lf20_lk80fpsm',     // checkmark verde clásico
  'error':          'lf20_qpwbiyxf',     // X roja
  'empty-cart':     'lf20_ydo1amjm',     // carrito vacío
  'delivery-truck': 'lf20_zw0djhar',     // camión moviéndose
  'fire-cooking':   'lf20_pnu3qxng',     // fuego/llama
  'whatsapp':       'lf20_x62chJ',       // burbuja chat verde
  'scale-weight':   'lf20_kzpkqkhb',     // báscula
  'fridge':         'lf20_jvxihagn',     // copo de nieve / frío
  'steam':          'lf20_3l4hwkvr',     // humo/vapor
  'hero-meat':      'lf20_b88nh30c',     // carne/parrilla
  'onboarding':     'lf20_jmgekfqg',     // bienvenida/celebración
};

function tryDownload(id) {
  return new Promise((resolve, reject) => {
    const servers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    let i = 0;
    const next = () => {
      if (i >= servers.length) return reject(new Error(`all servers 404 for ${id}`));
      const url = `https://assets${servers[i]}.lottiefiles.com/packages/${id}.json`;
      i++;
      https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // sigue el redirect manualmente
          https.get(res.headers.location, (r2) => {
            if (r2.statusCode !== 200) { res.resume(); next(); return; }
            const c = []; r2.on('data', x => c.push(x));
            r2.on('end', () => resolve({ url, body: Buffer.concat(c) }));
          }).on('error', () => next());
          return;
        }
        if (res.statusCode !== 200) { res.resume(); next(); return; }
        const c = []; res.on('data', x => c.push(x));
        res.on('end', () => resolve({ url, body: Buffer.concat(c) }));
      }).on('error', () => next());
    };
    next();
  });
}

(async () => {
  const entries = Object.entries(LOTTIES);
  let ok = 0, fail = 0;
  const failed = [];
  for (const [slug, id] of entries) {
    const out = path.join(OUT_DIR, `${slug}.json`);
    try {
      const { url, body } = await tryDownload(id);
      // Validamos que sea JSON Lottie real (no HTML de error)
      try { JSON.parse(body.toString('utf8')); } catch { throw new Error('not JSON'); }
      fs.writeFileSync(out, body);
      ok++;
      console.log(`✓ ${slug.padEnd(16)} (${(body.length/1024).toFixed(1)}KB)  ← ${id}`);
    } catch (e) {
      fail++;
      failed.push({ slug, id, error: e.message });
      console.log(`✗ ${slug.padEnd(16)} ← ${id}  (${e.message})`);
    }
  }
  console.log(`\n=== Done: ${ok} OK, ${fail} fail (of ${entries.length}) ===`);
  if (failed.length) {
    console.log('\nFalla detalle:');
    failed.forEach(f => console.log(`  ${f.slug} (${f.id}): ${f.error}`));
  }
})();
