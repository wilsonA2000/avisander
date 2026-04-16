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

function redeemPoints(userId, orderId, points) {
  if (!isEnabled() || !userId || points <= 0) return 0
  const balance = getBalance(userId)
  const actual = Math.min(points, balance)
  if (actual <= 0) return 0

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

module.exports = { isEnabled, pointsPer1000, pointValue, getBalance, earnPoints, redeemPoints, adjustPoints, getHistory }
