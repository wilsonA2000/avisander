const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { reviewCreateSchema, reviewModerateSchema } = require('../schemas/review')

const router = express.Router()

function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row?.value ?? fallback
}

// Público: lista de reviews aprobadas de un producto + resumen (promedio y total).
router.get('/product/:productId', (req, res, next) => {
  try {
    const productId = Number(req.params.productId)
    if (!Number.isInteger(productId) || productId <= 0) {
      return res.status(400).json({ error: 'productId inválido' })
    }
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10))
    const offset = (page - 1) * limit

    const summary = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(AVG(rating), 0) AS avg_rating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS r5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS r4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS r3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) AS r2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS r1
         FROM reviews WHERE product_id = ? AND approved = 1`
      )
      .get(productId)

    const items = db
      .prepare(
        `SELECT r.id, r.rating, r.comment, r.created_at,
                u.name AS user_name, u.avatar_url AS user_avatar
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         WHERE r.product_id = ? AND r.approved = 1
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(productId, limit, offset)

    res.json({
      summary: {
        total: summary.total,
        avg_rating: Number(summary.avg_rating) || 0,
        breakdown: { 5: summary.r5, 4: summary.r4, 3: summary.r3, 2: summary.r2, 1: summary.r1 }
      },
      items,
      page,
      limit
    })
  } catch (error) {
    next(error)
  }
})

// Público: promedios para N productos a la vez (usado en cards de catálogo).
// Query: ids=1,2,3,...
router.get('/summary-batch', (req, res, next) => {
  try {
    const raw = String(req.query.ids || '').trim()
    if (!raw) return res.json({})
    const ids = raw
      .split(',')
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isInteger(n) && n > 0)
      .slice(0, 200)
    if (ids.length === 0) return res.json({})
    const placeholders = ids.map(() => '?').join(',')
    const rows = db
      .prepare(
        `SELECT product_id, COUNT(*) AS total, AVG(rating) AS avg_rating
         FROM reviews
         WHERE approved = 1 AND product_id IN (${placeholders})
         GROUP BY product_id`
      )
      .all(...ids)
    const map = {}
    for (const r of rows) {
      map[r.product_id] = { total: r.total, avg_rating: Number(r.avg_rating) || 0 }
    }
    res.json(map)
  } catch (error) {
    next(error)
  }
})

// Autenticado: productos elegibles para reseñar (órdenes completadas sin reseña aún).
router.get('/eligible', authenticateToken, (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT oi.order_id, oi.product_id, oi.product_name, o.created_at AS ordered_at,
                p.image_url,
                (SELECT id FROM reviews r
                  WHERE r.user_id = ? AND r.product_id = oi.product_id AND r.order_id = oi.order_id
                  LIMIT 1) AS review_id
         FROM order_items oi
         JOIN orders o ON o.id = oi.order_id
         LEFT JOIN products p ON p.id = oi.product_id
         WHERE o.user_id = ? AND o.status = 'completed'
         ORDER BY o.created_at DESC`
      )
      .all(req.user.id, req.user.id)
    res.json(rows.filter((r) => !r.review_id))
  } catch (error) {
    next(error)
  }
})

// Autenticado: mis reviews.
router.get('/mine', authenticateToken, (req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT r.id, r.product_id, r.order_id, r.rating, r.comment, r.approved, r.created_at,
                p.name AS product_name, p.image_url
         FROM reviews r
         LEFT JOIN products p ON p.id = r.product_id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`
      )
      .all(req.user.id)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Autenticado: crear review. Requiere que la orden pertenezca al usuario, esté
// completed y contenga el producto.
router.post('/', authenticateToken, validate(reviewCreateSchema), (req, res, next) => {
  try {
    const { product_id, order_id, rating, comment } = req.body
    const order = db
      .prepare('SELECT id, user_id, status FROM orders WHERE id = ?')
      .get(order_id)
    if (!order || order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'La orden no te pertenece' })
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Solo puedes reseñar pedidos entregados' })
    }
    const hasProduct = db
      .prepare('SELECT 1 FROM order_items WHERE order_id = ? AND product_id = ?')
      .get(order_id, product_id)
    if (!hasProduct) {
      return res.status(400).json({ error: 'El producto no estaba en esa orden' })
    }
    const existing = db
      .prepare('SELECT id FROM reviews WHERE user_id = ? AND product_id = ? AND order_id = ?')
      .get(req.user.id, product_id, order_id)
    if (existing) {
      return res.status(409).json({ error: 'Ya reseñaste este producto en esta orden' })
    }
    const autoApprove = getSetting('reviews_auto_approve', '1') === '1'
    const result = db
      .prepare(
        `INSERT INTO reviews (product_id, user_id, order_id, rating, comment, approved)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(product_id, req.user.id, order_id, rating, comment || null, autoApprove ? 1 : 0)
    const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

// Eliminar mi propia review.
router.delete('/:id', authenticateToken, (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const review = db.prepare('SELECT user_id FROM reviews WHERE id = ?').get(id)
    if (!review) return res.status(404).json({ error: 'Review no encontrada' })
    const isOwner = review.user_id === req.user.id
    const isAdmin = req.user.role === 'admin'
    if (!isOwner && !isAdmin) return res.status(403).json({ error: 'No autorizado' })
    db.prepare('DELETE FROM reviews WHERE id = ?').run(id)
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

// Admin: listar con filtros.
router.get('/admin', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { status } = req.query // 'pending' | 'approved' | 'all'
    const where = status === 'pending' ? 'WHERE r.approved = 0'
      : status === 'approved' ? 'WHERE r.approved = 1'
      : ''
    const rows = db
      .prepare(
        `SELECT r.id, r.rating, r.comment, r.approved, r.created_at,
                r.product_id, r.order_id,
                p.name AS product_name, p.image_url,
                u.id AS user_id, u.name AS user_name, u.email AS user_email
         FROM reviews r
         JOIN users u ON u.id = r.user_id
         LEFT JOIN products p ON p.id = r.product_id
         ${where}
         ORDER BY r.created_at DESC
         LIMIT 200`
      )
      .all()
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Admin: moderar (aprobar/rechazar).
router.patch(
  '/admin/:id',
  authenticateToken,
  requireAdmin,
  validate(reviewModerateSchema),
  (req, res, next) => {
    try {
      const id = Number(req.params.id)
      const existing = db.prepare('SELECT id FROM reviews WHERE id = ?').get(id)
      if (!existing) return res.status(404).json({ error: 'Review no encontrada' })
      db.prepare('UPDATE reviews SET approved = ? WHERE id = ?').run(req.body.approved ? 1 : 0, id)
      const updated = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)
      res.json(updated)
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
