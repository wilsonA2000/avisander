#!/usr/bin/env node
// Genera public/sitemap.xml consultando el backend local en build time.

const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.SITE_URL || 'https://avisander.com'
const API = process.env.API_URL || 'http://localhost:3000'

const STATIC_URLS = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/productos', priority: '0.9', changefreq: 'daily' },
  { loc: '/recetas', priority: '0.7', changefreq: 'weekly' }
]

async function fetchJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function main() {
  const urls = [...STATIC_URLS]

  const products = await fetchJson(`${API}/api/products?per_page=500&page=1`)
  if (products?.items) {
    for (const p of products.items) {
      urls.push({ loc: `/producto/${p.id}`, priority: '0.8', changefreq: 'weekly' })
    }
  } else if (Array.isArray(products)) {
    for (const p of products) {
      urls.push({ loc: `/producto/${p.id}`, priority: '0.8', changefreq: 'weekly' })
    }
  }

  const recipes = await fetchJson(`${API}/api/recipes`)
  if (Array.isArray(recipes)) {
    for (const r of recipes) {
      urls.push({ loc: `/recetas/${r.slug}`, priority: '0.6', changefreq: 'monthly' })
    }
  }

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url>\n    <loc>${BASE_URL}${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n') +
    '\n</urlset>\n'

  const outPath = path.join(__dirname, '..', 'public', 'sitemap.xml')
  fs.writeFileSync(outPath, xml)
  console.log(`✓ sitemap.xml generado con ${urls.length} URLs`)
}

main().catch((err) => {
  console.error('Error generando sitemap:', err)
  process.exit(1)
})
