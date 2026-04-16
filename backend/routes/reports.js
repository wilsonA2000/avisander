// Reportes agregados para el dashboard admin.
// SQL directo con strftime para series temporales; sin librerías de agregación.

const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticateToken, requireAdmin)

// Parsea rangos de fechas. Por defecto: últimos 30 días (incluye hoy).
function parseRange(query) {
  const today = new Date()
  const defaultFrom = new Date(today.getTime() - 29 * 86400_000)
  const from = query.from ? new Date(query.from) : defaultFrom
  const to = query.to ? new Date(query.to) : today
  // Normalizamos a inicio/fin del día (sistema local → ISO)
  const fromStr = from.toISOString().slice(0, 10) + ' 00:00:00'
  const toStr = to.toISOString().slice(0, 10) + ' 23:59:59'
  const granularity = ['day', 'week', 'month'].includes(query.granularity) ? query.granularity : 'day'
  return { from: fromStr, to: toStr, granularity, fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) }
}

// Tarifa estimada Bold tarjeta: 2.69% + $300 por orden aprobada.
// Hasta que podamos distinguir tarjeta vs PSE desde el webhook.
function estimateCommissions(orders) {
  return orders.reduce((acc, o) => {
    if (o.payment_method === 'bold' && o.payment_status === 'approved') {
      return acc + o.total * 0.0269 + 300
    }
    return acc
  }, 0)
}

router.get('/summary', (req, res, next) => {
  try {
    const range = parseRange(req.query)

    // Todas las órdenes del período (en memoria para calcular agregaciones flexibles).
    const orders = db
      .prepare(
        `SELECT id, total, delivery_cost, status, payment_method, payment_status,
                delivery_method, created_at, user_id, customer_phone
         FROM orders
         WHERE created_at >= ? AND created_at <= ?`
      )
      .all(range.from, range.to)

    const ordersCount = orders.length
    const revenueGross = orders.reduce((a, o) => a + (o.total || 0), 0)
    const revenueDelivery = orders.reduce((a, o) => a + (o.delivery_cost || 0), 0)
    const revenueProducts = revenueGross - revenueDelivery
    const avgTicket = ordersCount > 0 ? revenueGross / ordersCount : 0

    // Clientes nuevos vs recurrentes (basado en si el user_id tenía órdenes anteriores al período).
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))]
    let newCustomers = 0
    let returningCustomers = 0
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',')
      const prior = db
        .prepare(
          `SELECT user_id, COUNT(*) as c FROM orders
           WHERE user_id IN (${placeholders}) AND created_at < ?
           GROUP BY user_id`
        )
        .all(...userIds, range.from)
      const priorSet = new Set(prior.map((p) => p.user_id))
      for (const uid of userIds) {
        if (priorSet.has(uid)) returningCustomers++
        else newCustomers++
      }
    }

    const byBucket = (key, valueFn) => {
      const acc = {}
      for (const o of orders) {
        const k = o[key] || 'unknown'
        if (!acc[k]) acc[k] = { count: 0, total: 0 }
        acc[k].count++
        acc[k].total += valueFn(o)
      }
      return acc
    }

    const by_payment_method = byBucket('payment_method', (o) => o.total || 0)
    const by_status = byBucket('status', (o) => o.total || 0)
    const by_payment_status = byBucket('payment_status', (o) => o.total || 0)
    const by_delivery = byBucket('delivery_method', (o) => o.total || 0)

    // Serie temporal por día. Llenamos huecos con 0.
    const bucketFormat =
      range.granularity === 'month' ? '%Y-%m' :
      range.granularity === 'week' ? '%Y-W%W' :
      '%Y-%m-%d'
    const seriesRows = db
      .prepare(
        `SELECT strftime(?, created_at) AS bucket,
                COUNT(*) as orders, SUM(total) as revenue
         FROM orders WHERE created_at >= ? AND created_at <= ?
         GROUP BY bucket ORDER BY bucket ASC`
      )
      .all(bucketFormat, range.from, range.to)

    // Rellena días vacíos entre from y to (solo para day granularity)
    let series = seriesRows
    if (range.granularity === 'day') {
      const byDate = Object.fromEntries(seriesRows.map((r) => [r.bucket, r]))
      series = []
      const start = new Date(range.fromISO)
      const end = new Date(range.toISO)
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const k = d.toISOString().slice(0, 10)
        series.push(byDate[k] || { bucket: k, orders: 0, revenue: 0 })
      }
    }

    const commissions_estimated = estimateCommissions(orders)

    res.json({
      range: { from: range.fromISO, to: range.toISO, granularity: range.granularity },
      totals: {
        orders_count: ordersCount,
        revenue_gross: revenueGross,
        revenue_products: revenueProducts,
        revenue_delivery: revenueDelivery,
        avg_ticket: avgTicket,
        new_customers: newCustomers,
        returning_customers: returningCustomers,
        commissions_estimated
      },
      by_payment_method,
      by_payment_status,
      by_status,
      by_delivery,
      series
    })
  } catch (error) {
    next(error)
  }
})

router.get('/top-products', (req, res, next) => {
  try {
    const range = parseRange(req.query)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

    const rows = db
      .prepare(
        `SELECT oi.product_id, oi.product_name,
                SUM(oi.quantity) as qty,
                SUM(oi.subtotal) as revenue,
                COUNT(DISTINCT o.id) as orders_count
         FROM order_items oi
         INNER JOIN orders o ON o.id = oi.order_id
         WHERE o.created_at >= ? AND o.created_at <= ?
           AND oi.product_id IS NOT NULL
         GROUP BY oi.product_id, oi.product_name
         ORDER BY revenue DESC
         LIMIT ?`
      )
      .all(range.from, range.to, limit)

    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.get('/by-hour', (req, res, next) => {
  try {
    const range = parseRange(req.query)
    const rows = db
      .prepare(
        `SELECT CAST(strftime('%H', created_at) AS INTEGER) AS hour,
                COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders WHERE created_at >= ? AND created_at <= ?
         GROUP BY hour ORDER BY hour`
      )
      .all(range.from, range.to)
    const full = Array.from({ length: 24 }, (_, h) => {
      const row = rows.find((r) => r.hour === h)
      return { hour: h, label: `${String(h).padStart(2,'0')}:00`, orders: row?.orders || 0, revenue: row?.revenue || 0 }
    })
    res.json(full)
  } catch (error) { next(error) }
})

router.get('/by-weekday', (req, res, next) => {
  try {
    const range = parseRange(req.query)
    const labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const rows = db
      .prepare(
        `SELECT CAST(strftime('%w', created_at) AS INTEGER) AS dow,
                COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders WHERE created_at >= ? AND created_at <= ?
         GROUP BY dow ORDER BY dow`
      )
      .all(range.from, range.to)
    const full = labels.map((name, i) => {
      const row = rows.find((r) => r.dow === i)
      return { dow: i, name, orders: row?.orders || 0, revenue: row?.revenue || 0 }
    })
    res.json(full)
  } catch (error) { next(error) }
})

router.get('/loyalty-summary', (req, res, next) => {
  try {
    const range = parseRange(req.query)
    const earned = db.prepare(
      `SELECT COALESCE(SUM(points),0) AS total FROM loyalty_transactions
       WHERE type='earn' AND created_at >= ? AND created_at <= ?`
    ).get(range.from, range.to)
    const redeemed = db.prepare(
      `SELECT COALESCE(SUM(ABS(points)),0) AS total FROM loyalty_transactions
       WHERE type='redeem' AND created_at >= ? AND created_at <= ?`
    ).get(range.from, range.to)
    const activeUsers = db.prepare(
      'SELECT COUNT(*) AS n FROM users WHERE loyalty_balance > 0'
    ).get()
    res.json({
      points_earned: earned.total,
      points_redeemed: redeemed.total,
      active_loyalty_users: activeUsers.n
    })
  } catch (error) { next(error) }
})

module.exports = router
