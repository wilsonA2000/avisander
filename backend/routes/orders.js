const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')

const router = express.Router()

// Get orders (admin: all, customer: own)
router.get('/', authenticateToken, (req, res) => {
  try {
    let orders

    if (req.user.role === 'admin') {
      orders = db.prepare(`
        SELECT * FROM orders ORDER BY created_at DESC
      `).all()
    } else {
      orders = db.prepare(`
        SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC
      `).all(req.user.id)
    }

    // Get order items for each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?')
    orders = orders.map(order => ({
      ...order,
      items: getItems.all(order.id)
    }))

    res.json(orders)
  } catch (error) {
    console.error('Get orders error:', error)
    res.status(500).json({ error: 'Error al obtener pedidos' })
  }
})

// Get single order
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)

    if (!order) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }

    // Check permission
    if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' })
    }

    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id)
    res.json(order)
  } catch (error) {
    console.error('Get order error:', error)
    res.status(500).json({ error: 'Error al obtener pedido' })
  }
})

// Create order
router.post('/', optionalAuth, (req, res) => {
  try {
    const { items, customer_name, customer_phone, customer_address, notes } = req.body

    if (!items || !items.length) {
      return res.status(400).json({ error: 'El pedido debe tener al menos un producto' })
    }

    // Get delivery cost from settings
    const deliverySetting = db.prepare("SELECT value FROM settings WHERE key = 'delivery_cost'").get()
    const delivery_cost = deliverySetting ? parseFloat(deliverySetting.value) : 5000

    // Calculate total
    let subtotal = 0
    const orderItems = items.map(item => {
      const itemSubtotal = item.price * item.quantity
      subtotal += itemSubtotal
      return {
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        subtotal: itemSubtotal
      }
    })

    const total = subtotal + delivery_cost

    // Insert order
    const result = db.prepare(`
      INSERT INTO orders (user_id, total, delivery_cost, customer_name, customer_phone, customer_address, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user?.id || null,
      total,
      delivery_cost,
      customer_name || req.user?.name || null,
      customer_phone || req.user?.phone || null,
      customer_address || req.user?.address || null,
      notes || null
    )

    const orderId = result.lastInsertRowid

    // Insert order items
    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    for (const item of orderItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.unit_price, item.subtotal)
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
    order.items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId)

    res.status(201).json(order)
  } catch (error) {
    console.error('Create order error:', error)
    res.status(500).json({ error: 'Error al crear pedido' })
  }
})

// Update order status (admin only)
router.put('/:id/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ error: 'Estado es requerido' })
    }

    const validStatuses = ['pending', 'processing', 'completed', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado invalido' })
    }

    const existing = db.prepare('SELECT id FROM orders WHERE id = ?').get(req.params.id)
    if (!existing) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, req.params.id)

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)
    res.json(order)
  } catch (error) {
    console.error('Update order status error:', error)
    res.status(500).json({ error: 'Error al actualizar estado' })
  }
})

module.exports = router
