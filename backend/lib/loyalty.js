const { db } = require('../db/database')

function getSetting(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row?.value ?? defaultValue
}

function isEnabled() {
  return getSetting('loyalty_enabled', '1') === '1'
}

function pointsPer1000() {
  return Number(getSetting('loyalty_points_per_1000', '1')) || 1
}

function pointValue() {
  return Number(getSetting('loyalty_point_value', '1')) || 1
}

function getBalance(userId) {
  const row = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(userId)
  return row?.loyalty_balance || 0
}

function earnPoints(userId, orderId, totalPesos) {
  if (!isEnabled() || !userId) return 0
  const rate = pointsPer1000()
  const earned = Math.floor((totalPesos / 1000) * rate)
  if (earned <= 0) return 0

  const trx = db.transaction(() => {
    db.prepare('UPDATE users SET loyalty_balance = loyalty_balance + ? WHERE id = ?').run(earned, userId)
    const newBalance = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(userId).loyalty_balance
    db.prepare(
      `INSERT INTO loyalty_transactions (user_id, order_id, type, points, balance_after, reason)
       VALUES (?, ?, 'earn', ?, ?, ?)`
    ).run(userId, orderId, earned, newBalance, `Compra pedido #${orderId}`)
    db.prepare('UPDATE orders SET loyalty_points_earned = ? WHERE id = ?').run(earned, orderId)
    return earned
  })
  return trx()
}

// Mínimo de puntos exigido para poder canjear. Política de negocio: el canje
// queda reservado a compras con algo de volumen para evitar fricción operativa
// con canjes de $50-$500 y mantener la percepción de "premio" en fidelización.
const REDEEM_MIN_POINTS = 1000

function redeemPoints(userId, orderId, points) {
  if (!isEnabled() || !userId || points <= 0) return 0
  const balance = getBalance(userId)
  const actual = Math.min(points, balance)
  if (actual < REDEEM_MIN_POINTS) return 0

  const trx = db.transaction(() => {
    db.prepare('UPDATE users SET loyalty_balance = loyalty_balance - ? WHERE id = ?').run(actual, userId)
    const newBalance = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(userId).loyalty_balance
    db.prepare(
      `INSERT INTO loyalty_transactions (user_id, order_id, type, points, balance_after, reason)
       VALUES (?, ?, 'redeem', ?, ?, ?)`
    ).run(userId, orderId, -actual, newBalance, `Canje pedido #${orderId}`)
    db.prepare('UPDATE orders SET loyalty_points_redeemed = ? WHERE id = ?').run(actual, orderId)
    return actual
  })
  return trx()
}

// Revierte puntos de una orden cancelada/abandonada. Idempotente: si ya se
// revirtió antes (verificado por loyalty_transactions), no hace nada. Deja
// loyalty_points_earned/redeemed en la orden como registro histórico.
function revertOrderLoyalty(orderId, reason) {
  const order = db.prepare(
    'SELECT id, user_id, loyalty_points_earned, loyalty_points_redeemed FROM orders WHERE id = ?'
  ).get(orderId)
  if (!order?.user_id) return { refunded: 0, removed: 0 }
  if (!order.loyalty_points_earned && !order.loyalty_points_redeemed) return { refunded: 0, removed: 0 }

  const already = db.prepare(
    `SELECT COUNT(*) AS c FROM loyalty_transactions
     WHERE order_id = ? AND type IN ('redeem_refund', 'earn_reversal')`
  ).get(orderId)
  if (already.c > 0) return { refunded: 0, removed: 0 }

  const trx = db.transaction(() => {
    let refunded = 0
    let removed = 0
    const reasonText = reason || 'Reverso por cambio de estado del pedido'

    // Devolver puntos canjeados (el cliente recupera lo que había canjeado).
    if (order.loyalty_points_redeemed > 0) {
      db.prepare('UPDATE users SET loyalty_balance = loyalty_balance + ? WHERE id = ?')
        .run(order.loyalty_points_redeemed, order.user_id)
      const newBalance = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(order.user_id).loyalty_balance
      db.prepare(
        `INSERT INTO loyalty_transactions (user_id, order_id, type, points, balance_after, reason)
         VALUES (?, ?, 'redeem_refund', ?, ?, ?)`
      ).run(order.user_id, orderId, order.loyalty_points_redeemed, newBalance, `Devolución canje pedido #${orderId} (${reasonText})`)
      refunded = order.loyalty_points_redeemed
    }
    // Quitar puntos ganados (si la orden había sido completada y luego se cancela).
    if (order.loyalty_points_earned > 0) {
      db.prepare('UPDATE users SET loyalty_balance = MAX(0, loyalty_balance - ?) WHERE id = ?')
        .run(order.loyalty_points_earned, order.user_id)
      const newBalance = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(order.user_id).loyalty_balance
      db.prepare(
        `INSERT INTO loyalty_transactions (user_id, order_id, type, points, balance_after, reason)
         VALUES (?, ?, 'earn_reversal', ?, ?, ?)`
      ).run(order.user_id, orderId, -order.loyalty_points_earned, newBalance, `Reverso ganancia pedido #${orderId} (${reasonText})`)
      removed = order.loyalty_points_earned
    }
    return { refunded, removed }
  })
  return trx()
}

function adjustPoints(userId, points, reason, adminId) {
  const trx = db.transaction(() => {
    db.prepare('UPDATE users SET loyalty_balance = MAX(0, loyalty_balance + ?) WHERE id = ?').run(points, userId)
    const newBalance = db.prepare('SELECT loyalty_balance FROM users WHERE id = ?').get(userId).loyalty_balance
    db.prepare(
      `INSERT INTO loyalty_transactions (user_id, type, points, balance_after, reason, admin_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(userId, points > 0 ? 'adjust_add' : 'adjust_sub', points, newBalance, reason, adminId)
    return newBalance
  })
  return trx()
}

function getHistory(userId, limit = 50) {
  return db.prepare(
    'SELECT * FROM loyalty_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit)
}

module.exports = {
  isEnabled,
  pointsPer1000,
  pointValue,
  getBalance,
  earnPoints,
  redeemPoints,
  revertOrderLoyalty,
  adjustPoints,
  getHistory,
  REDEEM_MIN_POINTS
}
