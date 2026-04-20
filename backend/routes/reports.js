// Reportes agregados para el dashboard admin.
// SQL directo con strftime para series temporales; sin librerías de agregación.

const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()
router.use(authenticateToken, requireAdmin)

// Parsea rangos de fechas. Las fechas del query son en zona Bogotá (UTC-5)
// pero created_at se guarda en UTC, así que convertimos el rango a UTC para
// que los índices sobre created_at sigan siendo usables.
const BOGOTA_OFFSET_HOURS = -5

function todayBogotaISO() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
}

function daysAgoBogotaISO(days) {
  const base = todayBogotaISO() + 'T12:00:00Z'
  const d = new Date(base)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function parseRange(query) {
  const toISO = query.to || todayBogotaISO()
  const fromISO = query.from || daysAgoBogotaISO(29)
  // Bogotá [from 00:00 → to 23:59] ≡ UTC [from+5h → to+1d+4h:59m:59s]
  const fromUTC = new Date(fromISO + 'T00:00:00-05:00').toISOString().slice(0, 19).replace('T', ' ')
  const toUTC = new Date(toISO + 'T23:59:59-05:00').toISOString().slice(0, 19).replace('T', ' ')
  const granularity = ['day', 'week', 'month'].includes(query.granularity) ? query.granularity : 'day'
  return { from: fromUTC, to: toUTC, granularity, fromISO, toISO }
}

// Helper SQL: convierte created_at (UTC) a local Bogotá antes de formatear.
const TZ_SHIFT = `'${BOGOTA_OFFSET_HOURS} hours'`

// Estados que NO representan venta: el pedido nunca llegó a ser dinero real.
// - cancelled: el admin o el cliente canceló explícitamente.
// - abandoned: el cliente inició Bold/checkout y no terminó (timeout o cerró).
// Para SQL se expanden a la lista literal; para filtros JS se usa el Set.
const NON_REVENUE_STATUSES = ['cancelled', 'abandoned']
const NON_REVENUE_SET = new Set(NON_REVENUE_STATUSES)
const NON_REVENUE_SQL = NON_REVENUE_STATUSES.map((s) => `'${s}'`).join(',')

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
    const allOrders = db
      .prepare(
        `SELECT id, total, delivery_cost, status, payment_method, payment_status,
                delivery_method, created_at, user_id, customer_phone
         FROM orders
         WHERE created_at >= ? AND created_at <= ?`
      )
      .all(range.from, range.to)

    // Los ingresos y ticket promedio se calculan SOLO sobre pedidos que podrían
    // concretarse (pending, processing, shipped, completed). Los cancelados y
    // abandonados nunca fueron dinero real en caja.
    const orders = allOrders.filter((o) => !NON_REVENUE_SET.has(o.status))
    const cancelledOrders = allOrders.filter((o) => o.status === 'cancelled')
    const abandonedOrders = allOrders.filter((o) => o.status === 'abandoned')

    const ordersCount = orders.length
    const revenueGross = orders.reduce((a, o) => a + (o.total || 0), 0)
    const revenueDelivery = orders.reduce((a, o) => a + (o.delivery_cost || 0), 0)
    const revenueProducts = revenueGross - revenueDelivery
    const avgTicket = ordersCount > 0 ? revenueGross / ordersCount : 0

    // Ingreso confirmado = completados, para distinguir del revenue "bruto" (pending + processing + shipped + completed).
    const revenueConfirmed = orders
      .filter((o) => o.status === 'completed')
      .reduce((a, o) => a + (o.total || 0), 0)

    // Clientes nuevos vs recurrentes. Para clientes registrados se identifica por user_id;
    // para invitados se usa customer_phone como fallback para no excluirlos.
    const identityOf = (o) => (o.user_id ? `u:${o.user_id}` : o.customer_phone ? `p:${o.customer_phone}` : null)
    const identities = [...new Set(orders.map(identityOf).filter(Boolean))]
    let newCustomers = 0
    let returningCustomers = 0
    if (identities.length > 0) {
      const userIdList = identities.filter((k) => k.startsWith('u:')).map((k) => parseInt(k.slice(2), 10))
      const phoneList = identities.filter((k) => k.startsWith('p:')).map((k) => k.slice(2))
      const priorUserIds = new Set()
      const priorPhones = new Set()
      if (userIdList.length > 0) {
        const ph = userIdList.map(() => '?').join(',')
        db.prepare(
          `SELECT DISTINCT user_id FROM orders
           WHERE user_id IN (${ph}) AND created_at < ?
             AND status NOT IN (${NON_REVENUE_SQL})`
        ).all(...userIdList, range.from).forEach((r) => priorUserIds.add(r.user_id))
      }
      if (phoneList.length > 0) {
        const ph = phoneList.map(() => '?').join(',')
        db.prepare(
          `SELECT DISTINCT customer_phone FROM orders
           WHERE customer_phone IN (${ph}) AND user_id IS NULL
             AND created_at < ? AND status NOT IN (${NON_REVENUE_SQL})`
        ).all(...phoneList, range.from).forEach((r) => priorPhones.add(r.customer_phone))
      }
      for (const key of identities) {
        const isReturning = key.startsWith('u:')
          ? priorUserIds.has(parseInt(key.slice(2), 10))
          : priorPhones.has(key.slice(2))
        if (isReturning) returningCustomers++
        else newCustomers++
      }
    }

    const byBucket = (rows, key, valueFn) => {
      const acc = {}
      for (const o of rows) {
        const k = o[key] || 'unknown'
        if (!acc[k]) acc[k] = { count: 0, total: 0 }
        acc[k].count++
        acc[k].total += valueFn(o)
      }
      return acc
    }

    // by_status usa TODOS los pedidos (así se ve cuántos cancelados hubo).
    // El resto usa solo los no cancelados para alinear con el revenue reportado.
    const by_payment_method = byBucket(orders, 'payment_method', (o) => o.total || 0)
    const by_status = byBucket(allOrders, 'status', (o) => o.total || 0)
    const by_payment_status = byBucket(orders, 'payment_status', (o) => o.total || 0)
    const by_delivery = byBucket(orders, 'delivery_method', (o) => o.total || 0)

    // Serie temporal por día. Llenamos huecos con 0. Excluye cancelados.
    // strftime con '-5 hours' convierte el timestamp UTC a fecha Bogotá.
    const bucketFormat =
      range.granularity === 'month' ? '%Y-%m' :
      range.granularity === 'week' ? '%Y-W%W' :
      '%Y-%m-%d'
    const seriesRows = db
      .prepare(
        `SELECT strftime(?, created_at, ${TZ_SHIFT}) AS bucket,
                COUNT(*) as orders, SUM(total) as revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
           AND status NOT IN (${NON_REVENUE_SQL})
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
        orders_count_all: allOrders.length,
        cancelled_count: cancelledOrders.length,
        cancelled_total: cancelledOrders.reduce((a, o) => a + (o.total || 0), 0),
        abandoned_count: abandonedOrders.length,
        abandoned_total: abandonedOrders.reduce((a, o) => a + (o.total || 0), 0),
        revenue_gross: revenueGross,
        revenue_confirmed: revenueConfirmed,
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
           AND o.status NOT IN (${NON_REVENUE_SQL})
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
        `SELECT CAST(strftime('%H', created_at, ${TZ_SHIFT}) AS INTEGER) AS hour,
                COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
           AND status NOT IN (${NON_REVENUE_SQL})
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
        `SELECT CAST(strftime('%w', created_at, ${TZ_SHIFT}) AS INTEGER) AS dow,
                COUNT(*) AS orders, COALESCE(SUM(total),0) AS revenue
         FROM orders
         WHERE created_at >= ? AND created_at <= ?
           AND status NOT IN (${NON_REVENUE_SQL})
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
