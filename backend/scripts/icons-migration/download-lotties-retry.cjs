// Reintento de los 5 Lotties que fallaron, con IDs alternativos del CDN público.
const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, 'media', 'lotties');

const LOTTIES = {
  'fire-cooking':   'lf20_yvrh9cry',
  'scale-weight':   'lf20_oxqmfvhv',
  'fridge':         'lf20_kkhbsacu',
  'steam':          'lf20_a2chheio',
  'onboarding':     'lf20_x17ybolp',
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
        if (res.statusCode !== 200) { res.resume(); next(); return; }
        const c = []; res.on('data', x => c.push(x));
        res.on('end', () => resolve({ url, body: Buffer.concat(c) }));
      }).on('error', () => next());
    };
    next();
  });
}

(async () => {
  for (const [slug, id] of Object.entries(LOTTIES)) {
    const out = path.join(OUT_DIR, `${slug}.json`);
    try {
      const { body } = await tryDownload(id);
      JSON.parse(body.toString('utf8'));
      fs.writeFileSync(out, body);
      console.log(`✓ ${slug.padEnd(16)} (${(body.length/1024).toFixed(1)}KB)  ← ${id}`);
    } catch (e) {
      console.log(`✗ ${slug.padEnd(16)} ← ${id}  (${e.message})`);
    }
  }
})();
