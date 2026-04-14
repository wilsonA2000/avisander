#!/usr/bin/env node
/**
 * Importador de la biblioteca personal del usuario (fotos + videos).
 *
 * Entrada por defecto:  /mnt/c/Users/wilso/Downloads/CARNICERIA AVISANDER media fotos videos
 * Salida:
 *   - backend/media/biblioteca/  (imágenes)
 *   - backend/media/videos/      (videos)
 * Y alimenta la tabla media_library con una fila por archivo.
 *
 * Auto-match: si el filename contiene palabras clave que coinciden con un producto
 * del catálogo, le asigna la foto como image_url automáticamente (solo si el
 * producto NO tenía foto propia).
 *
 * Uso:
 *   npm run media:import             # real
 *   npm run media:import -- --dry    # reporte sin copiar
 *   npm run media:import -- --source="/otra/ruta"
 */

require('dotenv').config()
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { validateEnv } = require('../lib/env')
validateEnv()

const { db, initialize } = require('../db/database')
initialize()

const args = process.argv.slice(2)
const dryRun = args.includes('--dry') || args.includes('--dry-run')
const sourceArg = args.find((a) => a.startsWith('--source='))
const SRC = sourceArg
  ? sourceArg.slice('--source='.length)
  : '/mnt/c/Users/wilso/Downloads/CARNICERIA AVISANDER media fotos videos'

const PROJECT_MEDIA = path.join(__dirname, '..', 'media')
const DEST_IMG = path.join(PROJECT_MEDIA, 'biblioteca')
const DEST_VIDEO = path.join(PROJECT_MEDIA, 'videos')

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.jfif', '.gif'])
const VIDEO_EXT = new Set(['.mp4', '.webm', '.mov'])
const IGNORE_EXT = new Set(['.zip', '.exe', '.json', '.db'])

// --- preparar BD ---
// Migración idempotente de la tabla media_library (no rompe si ya existe)
db.exec(`
  CREATE TABLE IF NOT EXISTS media_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    original_name TEXT,
    type TEXT NOT NULL,
    size INTEGER,
    hash TEXT,
    source TEXT,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_media_type ON media_library(type);
  CREATE INDEX IF NOT EXISTS idx_media_hash ON media_library(hash);
`)

if (!fs.existsSync(SRC)) {
  console.error(`Directorio de origen no existe: ${SRC}`)
  process.exit(1)
}

if (!dryRun) {
  fs.mkdirSync(DEST_IMG, { recursive: true })
  fs.mkdirSync(DEST_VIDEO, { recursive: true })
}

// Utilidades ---
function slugify(s) {
  return String(s)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').slice(0, 60) || 'archivo'
}

function hashFile(filePath) {
  const buf = fs.readFileSync(filePath)
  return crypto.createHash('sha256').update(buf).digest('hex')
}

// Recorrido recursivo
function walk(dir, list = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, list)
    else list.push(full)
  }
  return list
}

// --- cargar productos para auto-match ---
const allProducts = db.prepare('SELECT id, name, image_url, category_id FROM products').all()
const categoryByName = new Map(
  db.prepare('SELECT id, name FROM categories').all().map((c) => [c.id, c.name])
)

// Palabras-clave en el filename → función que intenta encontrar producto
function findProductByFilename(filename) {
  const n = slugify(filename)

  // Mapa keyword → lista de substrings que deben estar en el NOMBRE del producto
  const rules = [
    { kw: 'alas-sin-marinar', match: ['ala', 'sin marinar'] },
    { kw: 'alas', match: ['ala'] },
    { kw: 'chori', match: ['chorizo'] },
    { kw: 'chorizo', match: ['chorizo'] },
    { kw: 'mantequilla', match: ['mantequilla'] },
    { kw: 'muslos', match: ['muslo'] },
    { kw: 'pechuga', match: ['pechuga'] },
    { kw: 'pepitoria', match: ['pepitoria'] },
    { kw: 'rellenas', match: ['rellena'] },
    { kw: 'trucha', match: ['trucha'] },
    { kw: 'pollo-semicriollo', match: ['semicriollo'] },
    { kw: 'pollo-sin-marinar', match: ['pollo', 'sin marinar'] },
    { kw: 'pollo', match: ['pollo'] },
    { kw: 'carne', match: ['carne'] },
    { kw: 'costilla', match: ['costilla'] },
    { kw: 'lomo', match: ['lomo'] },
    { kw: 'salchicha', match: ['salchicha'] },
    { kw: 'queso', match: ['queso'] },
    { kw: 'aguacate', match: ['aguacate'] },
    { kw: 'huevo', match: ['huevo'] },
    { kw: 'jamon', match: ['jamon'] },
    { kw: 'salchichon', match: ['salchichon'] }
  ]

  for (const r of rules) {
    if (n.includes(r.kw)) {
      const needles = r.match.map((x) => slugify(x))
      const hit = allProducts.find((p) => {
        const pn = slugify(p.name)
        return needles.every((nd) => pn.includes(nd))
      })
      if (hit) return hit
    }
  }
  return null
}

// --- procesar ---
const files = walk(SRC)
console.log(`\nArchivos detectados: ${files.length}`)
console.log(`Modo: ${dryRun ? 'DRY-RUN' : 'ESCRITURA REAL'}`)
console.log(`Destino imágenes:  ${DEST_IMG}`)
console.log(`Destino videos:    ${DEST_VIDEO}\n`)

const insert = db.prepare(
  `INSERT OR IGNORE INTO media_library (url, original_name, type, size, hash, source, tags)
   VALUES (?, ?, ?, ?, ?, ?, ?)`
)
const existingHashes = new Set(
  db.prepare('SELECT hash FROM media_library WHERE hash IS NOT NULL').all().map((r) => r.hash)
)
const existingUrls = new Set(
  db.prepare('SELECT url FROM media_library').all().map((r) => r.url)
)

const updateProductPhoto = db.prepare(
  'UPDATE products SET image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND (image_url IS NULL OR image_url LIKE ?)'
)

const stats = {
  scanned: 0, copied: 0, skippedDup: 0, skippedBad: 0, autoMatched: 0,
  images: 0, videos: 0, totalMB: 0
}

const tx = db.transaction(() => {
  for (const src of files) {
    stats.scanned++
    const ext = path.extname(src).toLowerCase()
    const name = path.basename(src)

    if (IGNORE_EXT.has(ext)) { stats.skippedBad++; continue }

    const isImage = IMG_EXT.has(ext)
    const isVideo = VIDEO_EXT.has(ext)
    if (!isImage && !isVideo) { stats.skippedBad++; continue }

    const stat = fs.statSync(src)
    stats.totalMB += stat.size / 1024 / 1024

    // deduplicar por hash (mismo archivo subido 2 veces = 1 sola fila)
    const hash = hashFile(src)
    if (existingHashes.has(hash)) { stats.skippedDup++; continue }

    // destino con nombre limpio + hash prefix corto para evitar colisiones
    const baseSlug = slugify(path.basename(name, ext))
    const hashPrefix = hash.slice(0, 8)
    const targetName = `${baseSlug}-${hashPrefix}${ext === '.jfif' ? '.jpg' : ext}`
    const targetDir = isImage ? DEST_IMG : DEST_VIDEO
    const targetPath = path.join(targetDir, targetName)
    const subfolder = isImage ? 'biblioteca' : 'videos'
    const url = `/media/${subfolder}/${targetName}`

    if (existingUrls.has(url)) { stats.skippedDup++; continue }

    if (!dryRun) {
      fs.copyFileSync(src, targetPath)
      insert.run(url, name, isImage ? 'image' : 'video', stat.size, hash, path.dirname(src), null)
    }
    stats.copied++
    if (isImage) stats.images++
    else stats.videos++

    // Auto-match a producto
    if (isImage) {
      const match = findProductByFilename(name)
      if (match) {
        if (!dryRun) {
          // Solo pisar si no tiene foto real (permitir reemplazar URL de Unsplash)
          updateProductPhoto.run(url, match.id, '%images.unsplash.com%')
        }
        stats.autoMatched++
        console.log(`  ↳ match: "${name}"  →  ${match.name} (id ${match.id})`)
      }
    }

    existingHashes.add(hash)
    existingUrls.add(url)
  }
})

tx()

console.log('\n======= Resultado =======')
console.log(`  Escaneados:        ${stats.scanned}`)
console.log(`  ${dryRun ? 'Se copiarían' : 'Copiados'}:          ${stats.copied} (${stats.images} imágenes + ${stats.videos} videos)`)
console.log(`  Duplicados:        ${stats.skippedDup}`)
console.log(`  Ignorados (ext):   ${stats.skippedBad}`)
console.log(`  Auto-asignados:    ${stats.autoMatched}`)
console.log(`  Tamaño total:      ${stats.totalMB.toFixed(1)} MB`)
console.log('=========================\n')
