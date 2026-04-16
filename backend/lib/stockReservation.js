// Reserva temporal de stock con TTL.
//
// Contrato:
//   - Al crear una orden (status=pending) llamamos reserveForOrder(). Esto suma
//     cantidades a products.reserved_stock y marca orders.stock_reserved=1.
//   - La orden tiene expires_at = now + TTL (default 15 min).
//   - El scheduler corre cada 60s y llama expireStalePending() que libera reservas
//     y marca orders.status='cancelled' a todo pending con expires_at vencido.
//   - Al aprobar pago / admin completar / admin cancelar, llamamos releaseReservation()
//     para liberar reserved_stock (el descuento real de stock lo hace lib/inventory).
//   - Stock "disponible al público" = products.stock - products.reserved_stock.
//
// by_weight: NO se reserva. La cantidad real depende del corte y se ajusta por WhatsApp.

const { db } = require('../db/database')
const logger = require('./logger')

const RESERVATION_TTL_MINUTES = Number(process.env.STOCK_RESERVATION_TTL_MIN) || 15

function reserveForOrder(orderId) {
  const items = db
    .prepare(
      `SELECT product_id, sale_type, quantity
       FROM order_items WHERE order_id = ? AND product_id IS NOT NULL`
    )
    .all(orderId)

  const tx = db.transaction(() => {
    for (const it of items) {
      if ((it.sale_type || 'fixed') === 'by_weight') continue
      const qty = Number(it.quantity) || 0
      if (qty <= 0) continue
      db.prepare(
        'UPDATE products SET reserved_stock = reserved_stock + ? WHERE id = ?'
      ).run(qty, it.product_id)
    }
    const expiresAt = new Date(Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000).toISOString()
    db.prepare(
      'UPDATE orders SET stock_reserved = 1, expires_at = ? WHERE id = ?'
    ).run(expiresAt, orderId)
    return expiresAt
  })
  return tx()
}

// Libera reservas de una orden (idempotente). Se llama al completar (tras descuento
// real), cancelar, o expirar.
function releaseReservation(orderId) {
  const order = db
    .prepare('SELECT id, stock_reserved FROM orders WHERE id = ?')
    .get(orderId)
  if (!order || !order.stock_reserved) return 0

  const items = db
    .prepare(
      `SELECT product_id, sale_type, quantity
       FROM order_items WHERE order_id = ? AND product_id IS NOT NULL`
    )
    .all(orderId)

  const tx = db.transaction(() => {
    let released = 0
    for (const it of items) {
      if ((it.sale_type || 'fixed') === 'by_weight') continue
      const qty = Number(it.quantity) || 0
      if (qty <= 0) continue
      // MAX(0, ...) evita negativos si ya se liberó parcialmente por bug/race.
      db.prepare(
        'UPDATE products SET reserved_stock = MAX(0, reserved_stock - ?) WHERE id = ?'
      ).run(qty, it.product_id)
      released += qty
    }
    db.prepare(
      'UPDATE orders SET stock_reserved = 0, expires_at = NULL WHERE id = ?'
    ).run(orderId)
    return released
  })
  return tx()
}

// Busca pending expirados, los cancela y libera sus reservas.
function expireStalePending() {
  const nowIso = new Date().toISOString()
  const stale = db
    .prepare(
      `SELECT id FROM orders
       WHERE status = 'pending'
         AND stock_reserved = 1
         AND expires_at IS NOT NULL
         AND expires_at < ?`
    )
    .all(nowIso)

  for (const o of stale) {
    try {
      releaseReservation(o.id)
      db.prepare("UPDATE orders SET status = 'cancelled' WHERE id = ?").run(o.id)
      logger.info({ orderId: o.id }, 'Pedido pending expirado y cancelado')
    } catch (err) {
      logger.error({ err, orderId: o.id }, 'Error expirando pedido')
    }
  }
  return stale.length
}

let timerId = null
function startScheduler(intervalMs = 60_000) {
  if (timerId) return
  // Corremos una primera vez al arrancar por si el servidor se cayó con pendientes.
  try { expireStalePending() } catch (_e) { /* noop */ }
  timerId = setInterval(() => {
    try {
      expireStalePending()
    } catch (err) {
      logger.error({ err }, 'Fallo scheduler expiración pedidos')
    }
  }, intervalMs)
  if (timerId.unref) timerId.unref()
}

function stopScheduler() {
  if (timerId) clearInterval(timerId)
  timerId = null
}

module.exports = {
  reserveForOrder,
  releaseReservation,
  expireStalePending,
  startScheduler,
  stopScheduler,
  RESERVATION_TTL_MINUTES
}
