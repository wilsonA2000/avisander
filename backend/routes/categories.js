const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Get all categories (public)
router.get('/', (req, res) => {
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY display_order ASC').all()
    res.json(categories)
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ error: 'Error al obtener categorias' })
  }
})

// Get single category (public)
router.get('/:id', (req, res) => {
  try {
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)

    if (!category) {
      return res.status(404).json({ error: 'Categoria no encontrada' })
    }

    res.json(category)
  } catch (error) {
    console.error('Get category error:', error)
    res.status(500).json({ error: 'Error al obtener categoria' })
  }
})

// Create category (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, icon, display_order } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }

    const result = db.prepare(`
      INSERT INTO categories (name, icon, display_order)
      VALUES (?, ?, ?)
    `).run(name.trim(), icon || null, display_order || 0)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(category)
  } catch (error) {
    console.error('Create category error:', error)
    res.status(500).json({ error: 'Error al crear categoria' })
  }
})

// Update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { name, icon, display_order } = req.body

    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Categoria no encontrada' })
    }

    db.prepare(`
      UPDATE categories SET
        name = COALESCE(?, name),
        icon = ?,
        display_order = COALESCE(?, display_order)
      WHERE id = ?
    `).run(name, icon, display_order, req.params.id)

    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id)
    res.json(category)
  } catch (error) {
    console.error('Update category error:', error)
    res.status(500).json({ error: 'Error al actualizar categoria' })
  }
})

// Delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Categoria no encontrada' })
    }

    // Check if category has products
    const productCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?')
      .get(req.params.id)

    if (productCount.count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar. La categoria tiene ${productCount.count} producto(s) asociado(s).`
      })
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id)
    res.json({ message: 'Categoria eliminada' })
  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ error: 'Error al eliminar categoria' })
  }
})

module.exports = router
