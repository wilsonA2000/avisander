const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { categoryCreateSchema, categoryUpdateSchema } = require('../schemas/category')

const router = express.Router()

router.get('/', (_req, res, next) => {
  try {
    res.json(db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all())
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
      const { name, icon, display_order } = req.body
      const result = db
        .prepare('INSERT INTO categories (name, icon, display_order) VALUES (?, ?, ?)')
        .run(name, icon || null, display_order || 0)
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
        'UPDATE categories SET name = ?, icon = ?, display_order = ? WHERE id = ?'
      ).run(merged.name, merged.icon ?? null, merged.display_order ?? 0, req.params.id)
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
