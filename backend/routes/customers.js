// Endpoints del CRM básico: listado de clientes con conteos y detalle con historial.

const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim()
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const perPage = Math.min(100, Math.max(5, parseInt(req.query.per_page) || 30))
    const offset = (page - 1) * perPage

    const where = ["u.role = 'customer'"]
    const params = []
    if (q) {
      where.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR u.phone LIKE ?)')
      const needle = `%${q.toLowerCase()}%`
      params.push(needle, needle, `%${q}%`)
    }
    const whereClause = `WHERE ${where.join(' AND ')}`

    const total = db.prepare(`SELECT COUNT(*) AS n FROM users u ${whereClause}`).get(...params).n

    const items = db
      .prepare(
        `SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at, u.loyalty_balance,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id) AS orders_count,
          (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) AS total_spent,
          (SELECT MAX(created_at) FROM orders WHERE user_id = u.id) AS last_order_at,
          (SELECT COUNT(*) FROM orders WHERE user_id = u.id AND discount_amount > 0) AS discounts_used
         FROM users u
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(...params, perPage, offset)

    res.json({ items, total, page, per_page: perPage })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const user = db
      .prepare(
        `SELECT id, name, email, phone, address, created_at FROM users WHERE id = ? AND role = 'customer'`
      )
      .get(req.params.id)
    if (!user) return res.status(404).json({ error: 'Cliente no encontrado' })

    const orders = db
      .prepare(
        `SELECT id, total, delivery_cost, status, payment_status, payment_method, created_at, delivery_method
         FROM orders WHERE user_id = ?
         ORDER BY created_at DESC`
      )
      .all(user.id)

    const totals = {
      orders_count: orders.length,
      total_spent: orders.reduce((s, o) => s + (o.total || 0), 0),
      last_order_at: orders[0]?.created_at || null
    }

    res.json({ ...user, ...totals, orders })
  } catch (error) {
    next(error)
  }
})

module.exports = router
