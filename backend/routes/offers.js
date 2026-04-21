const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const {
  featuredOfferCreateSchema,
  featuredOfferUpdateSchema,
  featuredOfferReorderSchema
} = require('../schemas/offer')

const router = express.Router()

const MAX_ACTIVE = 10

const BASE_SELECT = `
  SELECT
    o.id, o.product_id, o.position, o.special_price, o.original_price_override,
    o.starts_at, o.ends_at, o.is_active, o.headline, o.created_at, o.updated_at,
    p.name AS product_name,
    p.slug AS product_slug,
    p.image_url AS product_image,
    p.price AS product_price,
    p.original_price AS product_original_price,
    p.unit AS product_unit,
    p.sale_type AS product_sale_type,
    p.price_per_kg AS product_price_per_kg,
    p.stock AS product_stock,
    p.reserved_stock AS product_reserved_stock,
    p.is_available AS product_is_available
  FROM featured_offers o
  JOIN products p ON p.id = o.product_id
`

function shapeOffer(row) {
  if (!row) return row
  const physical = Number(row.product_stock) || 0
  const reserved = Number(row.product_reserved_stock) || 0
  const stockAvailable = Math.max(0, physical - reserved)
  const effectivePrice =
    row.special_price != null ? Number(row.special_price) : Number(row.product_price)
  const displayOriginal =
    row.original_price_override != null
      ? Number(row.original_price_override)
      : row.product_original_price != null
        ? Number(row.product_original_price)
        : Number(row.product_price)
  return {
    id: row.id,
    product_id: row.product_id,
    position: row.position,
    special_price: row.special_price,
    original_price_override: row.original_price_override,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    is_active: !!row.is_active,
    headline: row.headline,
    created_at: row.created_at,
    updated_at: row.updated_at,
    product: {
      id: row.product_id,
      name: row.product_name,
      slug: row.product_slug,
      image_url: row.product_image,
      price: Number(row.product_price),
      original_price:
        row.product_original_price != null ? Number(row.product_original_price) : null,
      unit: row.product_unit,
      sale_type: row.product_sale_type,
      price_per_kg: row.product_price_per_kg != null ? Number(row.product_price_per_kg) : null,
      stock: stockAvailable,
      is_available: !!row.product_is_available
    },
    effective_price: effectivePrice,
    display_original_price: displayOriginal,
    discount_percent:
      displayOriginal > 0 && effectivePrice < displayOriginal
        ? Math.round(((displayOriginal - effectivePrice) / displayOriginal) * 100)
        : 0
  }
}

function countActive(excludeId = null) {
  const row = excludeId
    ? db
        .prepare('SELECT COUNT(*) AS c FROM featured_offers WHERE is_active = 1 AND id != ?')
        .get(excludeId)
    : db.prepare('SELECT COUNT(*) AS c FROM featured_offers WHERE is_active = 1').get()
  return row?.c || 0
}

function toSqliteBool(v) {
  if (v === undefined) return undefined
  if (typeof v === 'boolean') return v ? 1 : 0
  return Number(v) ? 1 : 0
}

router.get('/imperdibles', (_req, res, next) => {
  try {
    const nowIso = new Date().toISOString()
    const rows = db
      .prepare(
        `${BASE_SELECT}
         WHERE o.is_active = 1
           AND p.is_available = 1
           AND (o.starts_at IS NULL OR o.starts_at <= ?)
           AND (o.ends_at IS NULL OR o.ends_at > ?)
         ORDER BY o.position ASC, o.id ASC`
      )
      .all(nowIso, nowIso)
    res.json(rows.map(shapeOffer))
  } catch (error) {
    next(error)
  }
})

router.get('/admin/imperdibles', authenticateToken, requireAdmin, (_req, res, next) => {
  try {
    const rows = db
      .prepare(`${BASE_SELECT} ORDER BY o.is_active DESC, o.position ASC, o.id ASC`)
      .all()
    res.json({
      items: rows.map(shapeOffer),
      active_count: countActive(),
      max_active: MAX_ACTIVE
    })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/admin/imperdibles',
  authenticateToken,
  requireAdmin,
  validate(featuredOfferCreateSchema),
  (req, res, next) => {
    try {
      const {
        product_id,
        position = 0,
        special_price = null,
        original_price_override = null,
        starts_at = null,
        ends_at = null,
        is_active = 1,
        headline = null
      } = req.body

      const product = db.prepare('SELECT id FROM products WHERE id = ?').get(product_id)
      if (!product) return res.status(404).json({ error: 'Producto no encontrado' })

      const existing = db
        .prepare('SELECT id FROM featured_offers WHERE product_id = ?')
        .get(product_id)
      if (existing) {
        return res
          .status(409)
          .json({ error: 'Este producto ya está en Imperdibles', existing_id: existing.id })
      }

      const activeFlag = toSqliteBool(is_active) ?? 1
      if (activeFlag && countActive() >= MAX_ACTIVE) {
        return res.status(400).json({
          error: `Máximo ${MAX_ACTIVE} imperdibles activos. Desactiva alguno antes de agregar más.`
        })
      }

      const result = db
        .prepare(
          `INSERT INTO featured_offers
            (product_id, position, special_price, original_price_override,
             starts_at, ends_at, is_active, headline, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
        )
        .run(
          product_id,
          position || 0,
          special_price,
          original_price_override,
          starts_at,
          ends_at,
          activeFlag,
          headline
        )

      const row = db.prepare(`${BASE_SELECT} WHERE o.id = ?`).get(result.lastInsertRowid)
      res.status(201).json(shapeOffer(row))
    } catch (error) {
      next(error)
    }
  }
)

router.patch(
  '/admin/imperdibles/:id',
  authenticateToken,
  requireAdmin,
  validate(featuredOfferUpdateSchema),
  (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const existing = db.prepare('SELECT * FROM featured_offers WHERE id = ?').get(id)
      if (!existing) return res.status(404).json({ error: 'Imperdible no encontrado' })

      const merged = { ...existing }
      const allowed = [
        'position',
        'special_price',
        'original_price_override',
        'starts_at',
        'ends_at',
        'is_active',
        'headline'
      ]
      for (const key of allowed) {
        if (req.body[key] !== undefined) merged[key] = req.body[key]
      }

      const nextActive = toSqliteBool(merged.is_active) ?? 0
      if (nextActive && !existing.is_active && countActive(id) >= MAX_ACTIVE) {
        return res
          .status(400)
          .json({ error: `Máximo ${MAX_ACTIVE} imperdibles activos.` })
      }

      db.prepare(
        `UPDATE featured_offers
           SET position = ?, special_price = ?, original_price_override = ?,
               starts_at = ?, ends_at = ?, is_active = ?, headline = ?,
               updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      ).run(
        merged.position ?? 0,
        merged.special_price,
        merged.original_price_override,
        merged.starts_at,
        merged.ends_at,
        nextActive,
        merged.headline,
        id
      )

      const row = db.prepare(`${BASE_SELECT} WHERE o.id = ?`).get(id)
      res.json(shapeOffer(row))
    } catch (error) {
      next(error)
    }
  }
)

router.delete('/admin/imperdibles/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const existing = db.prepare('SELECT id FROM featured_offers WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Imperdible no encontrado' })
    db.prepare('DELETE FROM featured_offers WHERE id = ?').run(id)
    res.json({ message: 'Imperdible eliminado' })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/admin/imperdibles/reorder',
  authenticateToken,
  requireAdmin,
  validate(featuredOfferReorderSchema),
  (req, res, next) => {
    try {
      const { items } = req.body
      const update = db.prepare(
        'UPDATE featured_offers SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      const tx = db.transaction((rows) => {
        for (const r of rows) update.run(r.position, r.id)
      })
      tx(items)
      res.json({ message: 'Orden actualizado', count: items.length })
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
