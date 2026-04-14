// Endpoints de la biblioteca de medios (admin).
// Lista paginada + búsqueda + tagging + eliminación.

const express = require('express')
const fs = require('fs')
const path = require('path')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const logger = require('../lib/logger')

const router = express.Router()

// Asegurar tabla (idempotente; el script de import también la crea)
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
`)

// GET /api/media?type=image|video&q=pollo&page=1&per_page=60
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { type, q } = req.query
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const perPage = Math.min(120, Math.max(1, parseInt(req.query.per_page) || 60))
    const offset = (page - 1) * perPage

    const where = ['1=1']
    const params = []
    if (type === 'image' || type === 'video') {
      where.push('type = ?')
      params.push(type)
    }
    if (q) {
      where.push('LOWER(original_name) LIKE ?')
      params.push(`%${String(q).toLowerCase()}%`)
    }
    const whereClause = `WHERE ${where.join(' AND ')}`

    const total = db.prepare(`SELECT COUNT(*) AS n FROM media_library ${whereClause}`).get(...params).n
    const items = db
      .prepare(
        `SELECT id, url, original_name, type, size, created_at
         FROM media_library ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, perPage, offset)

    res.json({ items, total, page, per_page: perPage })
  } catch (error) {
    next(error)
  }
})

// GET /api/media/:id
router.get('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM media_library WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Medio no encontrado' })
    // Productos que usan esta URL
    // Incluye uso como principal, video o dentro de galería
    row.used_in_products = db
      .prepare(
        `SELECT id, name,
           CASE
             WHEN image_url = ? THEN 'principal'
             WHEN video_url = ? THEN 'video'
             WHEN gallery_urls LIKE ? THEN 'galería'
           END AS usage
         FROM products
         WHERE image_url = ? OR video_url = ? OR gallery_urls LIKE ?`
      )
      .all(row.url, row.url, `%"${row.url.replace(/"/g, '""')}"%`, row.url, row.url, `%"${row.url.replace(/"/g, '""')}"%`)
    res.json(row)
  } catch (error) {
    next(error)
  }
})

// POST /api/media/:id/assign
// body: { product_id, field: 'image_url' | 'gallery' | 'video_url' }
//  - 'image_url': reemplaza la foto principal
//  - 'gallery':   agrega a gallery_urls (array JSON), sin duplicados, máx 8
//  - 'video_url': asigna como video del producto (reemplaza si ya hay)
router.post('/:id/assign', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM media_library WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Medio no encontrado' })

    const productId = parseInt(req.body.product_id)
    const field = ['image_url', 'gallery', 'video_url'].includes(req.body.field)
      ? req.body.field
      : 'image_url'

    if (!productId) return res.status(400).json({ error: 'product_id requerido' })

    // Validación de tipo
    if (field === 'video_url' && row.type !== 'video') {
      return res.status(400).json({ error: 'El medio seleccionado no es un video' })
    }
    if ((field === 'image_url' || field === 'gallery') && row.type !== 'image') {
      return res.status(400).json({ error: 'El medio seleccionado no es una imagen' })
    }

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

    if (field === 'gallery') {
      // Parse actual
      let gallery = []
      if (product.gallery_urls) {
        try {
          const parsed = JSON.parse(product.gallery_urls)
          if (Array.isArray(parsed)) gallery = parsed
        } catch { gallery = [] }
      }
      if (gallery.includes(row.url)) {
        return res.status(400).json({ error: 'Esta imagen ya está en la galería' })
      }
      if (gallery.length >= 8) {
        return res.status(400).json({ error: 'La galería tiene el máximo de 8 imágenes. Quita alguna antes.' })
      }
      gallery.push(row.url)
      db.prepare('UPDATE products SET gallery_urls = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(JSON.stringify(gallery), productId)
      return res.json({ success: true, url: row.url, product_id: productId, field, gallery })
    }

    // image_url o video_url: reemplazo simple
    db.prepare(`UPDATE products SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(row.url, productId)
    res.json({ success: true, url: row.url, product_id: productId, field })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/media/:id/assign
// body: { product_id, field: 'image_url' | 'gallery' | 'video_url' }
// Para 'gallery' quita solo esa URL; para image_url/video_url la pone en NULL.
router.post('/:id/unassign', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM media_library WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Medio no encontrado' })

    const productId = parseInt(req.body.product_id)
    const field = ['image_url', 'gallery', 'video_url'].includes(req.body.field)
      ? req.body.field
      : 'image_url'

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

    if (field === 'gallery') {
      let gallery = []
      try { gallery = JSON.parse(product.gallery_urls || '[]') } catch { gallery = [] }
      const newGallery = gallery.filter((u) => u !== row.url)
      db.prepare('UPDATE products SET gallery_urls = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(newGallery.length ? JSON.stringify(newGallery) : null, productId)
      return res.json({ success: true, gallery: newGallery })
    }

    db.prepare(`UPDATE products SET ${field} = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(productId)
    res.json({ success: true, product_id: productId, field })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/media/:id → borra archivo + fila
router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const row = db.prepare('SELECT * FROM media_library WHERE id = ?').get(req.params.id)
    if (!row) return res.status(404).json({ error: 'Medio no encontrado' })

    // Seguridad: path debe estar dentro de backend/media
    const mediaRoot = path.join(__dirname, '..', 'media')
    const relPath = row.url.replace(/^\/media\//, '')
    const absolute = path.join(mediaRoot, relPath)
    if (!absolute.startsWith(mediaRoot + path.sep)) {
      return res.status(400).json({ error: 'Ruta inválida' })
    }

    // Rechazar si hay productos usándolo (para evitar 404s silenciosos)
    const used = db
      .prepare(
        'SELECT COUNT(*) AS n FROM products WHERE image_url = ? OR video_url = ? OR gallery_urls LIKE ?'
      )
      .get(row.url, row.url, `%"${row.url.replace(/"/g, '""')}"%`).n
    if (used > 0) {
      return res.status(400).json({ error: `No se puede eliminar: está asignado a ${used} producto(s). Desasígnalo primero.` })
    }

    try { if (fs.existsSync(absolute)) fs.unlinkSync(absolute) } catch (e) { logger.warn({ err: e }, 'No se pudo borrar archivo físico') }
    db.prepare('DELETE FROM media_library WHERE id = ?').run(row.id)
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

module.exports = router
