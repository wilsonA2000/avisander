// Descarga bulk de iconos Fluent Color (Microsoft, MIT) desde Iconify CDN.
// Renderiza cada SVG a PNG transparente 256x256 con sharp para uso en Avisander.
//
// Salida: backend/media/iconos/3d/<slug>.png

const fs = require('fs');
const path = require('path');
const https = require('https');
const sharp = require('sharp');

const OUT_DIR = path.join(__dirname, 'media', 'iconos', '3d');
const PREFIX = 'fluent-emoji'; // Fluent Color
const SIZE = 256;

// slug local → nombre del icono en Fluent Emoji (Iconify).
// Ajustes específicos donde Fluent no tiene el match exacto: usamos el
// equivalente más cercano (mismo dibujo) o un emoji genérico.
const MAP = {
  // CATEGORÍAS DE PRODUCTOS
  'res':           'cut-of-meat',
  'cerdo':         'pig-face',
  'pollo':         'rooster',
  'huevos':        'egg',
  'lacteos':       'glass-of-milk',
  'carnes-frias':  'sandwich',
  'embutidos':     'hot-dog',
  'congelado':     'snowflake',
  'fruver':        'green-salad',
  'varios':        'package',

  // USOS CULINARIOS
  'asar':          'fire',
  'parrilla':      'fire',
  'freir':         'cooking',
  'sofreir':       'shallow-pan-of-food',
  'hornear':       'pizza',
  'estofar':       'pot-of-food',
  'guisar':        'pot-of-food',
  'sudar':         'droplet',
  'ahumar':        'sparkles',
  'cocinar':       'cook',
  'microondas':    'kitchen',

  // TRUST + FEATURES
  'fresh':         'herb',
  'cold-chain':    'snowflake',
  'delivery':      'delivery-truck',
  'whatsapp-chat': 'speech-balloon',
  'quality-medal': 'sports-medal',

  // UI ACCIONES (HIGH IMPACT)
  'shopping-cart': 'shopping-cart',
  'user':          'bust-in-silhouette',
  'search':        'magnifying-glass-tilted-left',
  'heart':         'red-heart',
  'menu':          'hamburger', // visual de hamburguesa para menú (icónico)
  'close':         'cross-mark',
  'check':         'check-mark-button',
  'alert':         'warning',
  'error':         'cross-mark',
  'info':          'information',
  'clock':         'one-oclock',
  'calendar':      'calendar',
  'map-pin':       'round-pushpin',
  'phone':         'telephone-receiver',
  'mail':          'envelope',
  'help':          'red-question-mark',
  'shield':        'shield',
  'star':          'star',
  'arrow-right':   'right-arrow',
  'arrow-up':      'up-arrow',
  'play':          'play-button',
  'zoom-in':       'magnifying-glass-tilted-right',
  'eye':           'eye',
  'plus':          'plus',
  'minus':         'minus',

  // EXTRAS
  'target':        'bullseye',
  'users':         'busts-in-silhouette',
  'home':          'house',
  'book':          'open-book',
  'camera':        'camera',
  'save':          'floppy-disk',
  'trash':         'wastebasket',
  'pencil':        'pencil',
  'filter':        'control-knobs',
  'arrow-left':    'left-arrow',
  'chevron-left':  'left-arrow',
  'chevron-right': 'right-arrow',
  'chevron-down':  'down-arrow',
  'chevron-up':    'up-arrow',
  'tag':           'label',
  'bookmark':      'bookmark',
  'refresh':       'counterclockwise-arrows-button',
  'loader':        'hourglass-not-done',
  'building':      'office-building',
  'navigation':    'compass',
  'file':          'page-facing-up',
  'lock':          'locked',
  'shield-check':  'shield', // mismo escudo
  'shield-alert':  'shield',
  'file-search':   'page-with-curl',
  'user-check':    'bust-in-silhouette',
};

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function fetchSvg(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchSvg(res.headers.location).then(resolve, reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

(async () => {
  const entries = Object.entries(MAP);
  let ok = 0, fail = 0;
  const failed = [];
  for (const [slug, iconName] of entries) {
    const url = `https://api.iconify.design/${PREFIX}:${iconName}.svg`;
    const out = path.join(OUT_DIR, `${slug}.png`);
    try {
      const svg = await fetchSvg(url);
      // Iconify devuelve 404 como SVG vacío de 1x1 — detectar tamaño mínimo
      if (svg.length < 200) throw new Error(`empty SVG (${svg.length}B)`);
      await sharp(svg, { density: 384 })
        .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(out);
      ok++;
      process.stdout.write(`✓ ${slug.padEnd(18)} ← ${iconName}\n`);
    } catch (e) {
      fail++;
      failed.push({ slug, iconName, error: e.message });
      process.stdout.write(`✗ ${slug.padEnd(18)} ← ${iconName}  (${e.message})\n`);
    }
  }
  console.log(`\n=== Done: ${ok} OK, ${fail} fail (of ${entries.length}) ===`);
  if (failed.length) {
    console.log('\nFalla detalle:');
    failed.forEach(f => console.log(`  ${f.slug} (${f.iconName}): ${f.error}`));
  }
})();
