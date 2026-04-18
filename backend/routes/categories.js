const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { categoryCreateSchema, categoryUpdateSchema } = require('../schemas/category')

const router = express.Router()

router.get('/', (req, res, next) => {
  try {
    const withStats = req.query.stats === '1'
    if (!withStats) {
      return res.json(db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all())
    }
    const rows = db
      .prepare(
        `SELECT c.*,
           COUNT(CASE WHEN p.is_available = 1 THEN 1 END) AS product_count,
           SUM(CASE WHEN p.is_available = 1 AND p.is_on_sale = 1 THEN 1 ELSE 0 END) AS sale_count,
           COALESCE(c.hero_image, (
             SELECT p2.image_url FROM products p2
             WHERE p2.category_id = c.id
               AND p2.is_available = 1
               AND p2.image_url IS NOT NULL
               AND p2.image_url != ''
             ORDER BY p2.is_featured DESC, p2.id ASC
             LIMIT 1
           )) AS hero_image
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id
         GROUP BY c.id
         ORDER BY c.display_order ASC`
      )
      .all()
    res.json(
      rows.map((r) => ({
        ...r,
        product_count: r.product_count || 0,
        sale_count: r.sale_count || 0,
        has_sale: (r.sale_count || 0) > 0,
        hero_image: r.hero_image || null,
      }))
    )
  } catch (error) {
    next(error)
  }
})

router.get('/:id', (req, res, next) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' })
    res.json(category)
  } catch (error) {
    next(error)
  }
})

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validate(categoryCreateSchema),
  (req, res, next) => {
    try {
      const { name, icon, display_order, hero_image } = req.body
      const result = db
        .prepare('INSERT INTO categories (name, icon, display_order, hero_image) VALUES (?, ?, ?, ?)')
        .run(name, icon || null, display_order || 0, hero_image || null)
      res.status(201).json(
        db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
      )
    } catch (error) {
      next(error)
    }
  }
)

router.put(
  '/:id',
  authenticateToken,
  requireAdmin,
  validate(categoryUpdateSchema),
  (req, res, next) => {
    try {
      const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
      if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' })
      const merged = { ...existing, ...req.body }
      db.prepare(
        'UPDATE categories SET name = ?, icon = ?, display_order = ?, hero_image = ? WHERE id = ?'
      ).run(
        merged.name,
        merged.icon ?? null,
        merged.display_order ?? 0,
        merged.hero_image ?? null,
        req.params.id
      )
      res.json(db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id))
    } catch (error) {
      next(error)
    }
  }
)

router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Categoría no encontrada' })

    const productCount = db
      .prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
      .get(req.params.id)
    if (productCount.count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar. La categoría tiene ${productCount.count} producto(s) asociado(s).`
      })
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
    res.json({ message: 'Categoría eliminada' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
