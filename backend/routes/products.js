const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Get all products (public)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search } = req.query

    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `
    const params = []

    if (category) {
      query += ' AND LOWER(c.name) = ?'
      params.push(category.toLowerCase())
    }

    if (search) {
      query += ' AND LOWER(p.name) LIKE ?'
      params.push(`%${search.toLowerCase()}%`)
    }

    query += ' ORDER BY p.created_at DESC'

    const products = db.prepare(query).all(...params)
    res.json(products)
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Error al obtener productos' })
  }
})

// Get featured products (public)
router.get('/featured', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_featured = 1 AND p.is_available = 1
      ORDER BY p.created_at DESC
      LIMIT 8
    `).all()

    res.json(products)
  } catch (error) {
    console.error('Get featured error:', error)
    res.status(500).json({ error: 'Error al obtener productos destacados' })
  }
})

// Get products on sale (public)
router.get('/on-sale', (req, res) => {
  try {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_on_sale = 1 AND p.is_available = 1
      ORDER BY p.created_at DESC
      LIMIT 8
    `).all()

    res.json(products)
  } catch (error) {
    console.error('Get on-sale error:', error)
    res.status(500).json({ error: 'Error al obtener ofertas' })
  }
})

// Get single product (public)
router.get('/:id', (req, res) => {
  try {
    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id)

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    res.json(product)
  } catch (error) {
    console.error('Get product error:', error)
    res.status(500).json({ error: 'Error al obtener producto' })
  }
})

// Create product (admin only)
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name, description, price, original_price, unit,
      category_id, is_available, is_featured, is_on_sale, image_url
    } = req.body

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' })
    }

    const result = db.prepare(`
      INSERT INTO products (name, description, price, original_price, unit, category_id, is_available, is_featured, is_on_sale, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      description || null,
      price,
      original_price || null,
      unit || 'kg',
      category_id || null,
      is_available !== false ? 1 : 0,
      is_featured ? 1 : 0,
      is_on_sale ? 1 : 0,
      image_url || null
    )

    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(product)
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Error al crear producto' })
  }
})

// Update product (admin only)
router.put('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      name, description, price, original_price, unit,
      category_id, is_available, is_featured, is_on_sale, image_url
    } = req.body

    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    db.prepare(`
      UPDATE products SET
        name = COALESCE(?, name),
        description = ?,
        price = COALESCE(?, price),
        original_price = ?,
        unit = COALESCE(?, unit),
        category_id = ?,
        is_available = ?,
        is_featured = ?,
        is_on_sale = ?,
        image_url = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name,
      description,
      price,
      original_price,
      unit,
      category_id,
      is_available !== false ? 1 : 0,
      is_featured ? 1 : 0,
      is_on_sale ? 1 : 0,
      image_url,
      req.params.id
    )

    const product = db.prepare(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `).get(req.params.id)

    res.json(product)
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Error al actualizar producto' })
  }
})

// Delete product (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' })
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id)
    res.json({ message: 'Producto eliminado' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Error al eliminar producto' })
  }
})

module.exports = router
