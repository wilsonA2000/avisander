const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { inventoryAdjustSchema } = require('../schemas/inventory')
const inventory = require('../lib/inventory')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

// Vista unificada de stock por producto para /admin/inventario
router.get('/', (req, res, next) => {
  try {
    const { low_stock } = req.query
    const where = ['1=1']
    if (low_stock === '1' || low_stock === 'true') {
      where.push('p.stock <= p.stock_min')
    }
    const rows = db
      .prepare(
        `SELECT p.id, p.name, p.image_url, p.unit, p.sale_type, p.stock, p.stock_min,
                p.cost_price, p.barcode, c.name as category_name,
                (SELECT m.created_at FROM inventory_movements m
                  WHERE m.product_id = p.id ORDER BY m.id DESC LIMIT 1) AS last_movement_at,
                (SELECT m.type FROM inventory_movements m
                  WHERE m.product_id = p.id ORDER BY m.id DESC LIMIT 1) AS last_movement_type
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         WHERE ${where.join(' AND ')}
         ORDER BY (p.stock <= p.stock_min) DESC, p.name COLLATE NOCASE ASC`
      )
      .all()
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.get('/kardex/:productId', (req, res, next) => {
  try {
    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(req.params.productId)
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' })
    const movements = inventory.getKardex(req.params.productId, 100)
    res.json({ product, movements })
  } catch (error) {
    next(error)
  }
})

router.post('/adjust', validate(inventoryAdjustSchema), (req, res, next) => {
  try {
    const { product_id, quantity, type, notes } = req.body
    const result = inventory.recordMovement({
      productId: product_id,
      type,
      quantity,
      referenceType: 'manual',
      referenceId: null,
      notes,
      userId: req.user.id
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
})

module.exports = router
