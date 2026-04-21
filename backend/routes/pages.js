const express = require('express')
const { z } = require('zod')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')

const router = express.Router()

const SLUG_REGEX = /^[a-z0-9-]{2,60}$/

// Bloques permitidos. Si llegan tipos desconocidos los descartamos antes de
// guardar para evitar XSS por inyección de tipos arbitrarios en el renderer.
const ALLOWED_BLOCK_TYPES = new Set([
  'hero',
  'benefits',
  'split',
  'numbers',
  'process',
  'cta'
])

const blockSchema = z
  .object({
    type: z.string()
  })
  .passthrough()

const updatePageSchema = z.object({
  title: z.string().trim().min(2).max(120).optional(),
  blocks: z.array(blockSchema).max(40),
  published: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional()
})

function shapePage(row) {
  if (!row) return null
  let blocks = []
  try {
    blocks = JSON.parse(row.blocks_json || '[]')
    if (!Array.isArray(blocks)) blocks = []
  } catch {
    blocks = []
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    blocks,
    published: !!row.published,
    updated_at: row.updated_at,
    updated_by: row.updated_by
  }
}

router.get('/:slug', (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    if (!SLUG_REGEX.test(slug)) {
      return res.status(400).json({ error: 'Slug inválido' })
    }
    const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug)
    if (!row) return res.status(404).json({ error: 'Página no encontrada' })
    if (!row.published) return res.status(404).json({ error: 'Página no encontrada' })
    res.json(shapePage(row))
  } catch (error) {
    next(error)
  }
})

router.get('/admin/:slug', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase()
    if (!SLUG_REGEX.test(slug)) {
      return res.status(400).json({ error: 'Slug inválido' })
    }
    let row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug)
    if (!row) {
      // Si la página no existe aún, devolvemos un esqueleto vacío para que el
      // editor pueda empezar de cero sin un INSERT previo.
      return res.json({
        id: null,
        slug,
        title: slug,
        blocks: [],
        published: true,
        updated_at: null,
        updated_by: null
      })
    }
    res.json(shapePage(row))
  } catch (error) {
    next(error)
  }
})

router.put(
  '/admin/:slug',
  authenticateToken,
  requireAdmin,
  validate(updatePageSchema),
  (req, res, next) => {
    try {
      const slug = String(req.params.slug || '').toLowerCase()
      if (!SLUG_REGEX.test(slug)) {
        return res.status(400).json({ error: 'Slug inválido' })
      }

      // Filtramos bloques con tipo no permitido para evitar payloads exóticos.
      const safeBlocks = (req.body.blocks || []).filter((b) =>
        ALLOWED_BLOCK_TYPES.has(b.type)
      )

      const blocksJson = JSON.stringify(safeBlocks)
      const publishedFlag =
        req.body.published === undefined
          ? 1
          : typeof req.body.published === 'boolean'
            ? req.body.published
              ? 1
              : 0
            : Number(req.body.published) || 0

      const existing = db.prepare('SELECT id, title FROM pages WHERE slug = ?').get(slug)
      const title = req.body.title || existing?.title || slug

      if (existing) {
        db.prepare(
          `UPDATE pages
              SET title = ?, blocks_json = ?, published = ?,
                  updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE slug = ?`
        ).run(title, blocksJson, publishedFlag, req.user.id, slug)
      } else {
        db.prepare(
          `INSERT INTO pages (slug, title, blocks_json, published, updated_at, updated_by)
           VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)`
        ).run(slug, title, blocksJson, publishedFlag, req.user.id)
      }

      const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug)
      res.json(shapePage(row))
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
