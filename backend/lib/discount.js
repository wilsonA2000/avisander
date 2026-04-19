// Cálculo de descuentos aplicables a una orden.
//
// Regla actual: 10% (configurable) en la PRIMERA COMPRA COMPLETADA de un cliente
// REGISTRADO. Se considera primera compra si el user no tiene órdenes anteriores
// con status IN ('processing','completed') y sin descuento ya reclamado.
//
// Fraude: sólo se confía en user_id autenticado. Nunca en email/phone del body
// porque el cliente puede repetirlos.

const { db } = require('../db/database')

function getSetting(key, defaultValue = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key)
  return row?.value ?? defaultValue
}

/**
 * Devuelve { amount, reason, percent } si el cliente registrado califica para
 * el descuento de primera compra. Si no aplica, devuelve { amount: 0 }.
 *
 * @param {number|null} userId - id del usuario autenticado (null si invitado)
 * @param {number} subtotal - subtotal de items (antes del domicilio)
 */
function normalizePhone(phone) {
  if (!phone) return null
  const digits = String(phone).replace(/\D/g, '')
  if (!digits) return null
  // Últimos 10 dígitos: ignora prefijos +57 o 0.
  return digits.length > 10 ? digits.slice(-10) : digits
}

function computeFirstPurchaseDiscount(userId, subtotal) {
  if (!userId) return { amount: 0 }
  const enabled = getSetting('first_purchase_discount_enabled', '1')
  if (enabled !== '1' && enabled !== 'true') return { amount: 0 }

  const percent = Number(getSetting('first_purchase_discount_percent', '10')) || 0
  if (percent <= 0) return { amount: 0 }

  // ¿Tiene el usuario órdenes anteriores que ya hayan disfrutado descuento o
  // estén completadas/en preparación? Si sí, no aplica.
  const prev = db
    .prepare(
      `SELECT COUNT(*) as n FROM orders
       WHERE user_id = ?
         AND (status IN ('processing','completed') OR discount_amount > 0)`
    )
    .get(userId)
  if (prev.n > 0) return { amount: 0 }

  // Anti-fraude multi-cuenta: si el teléfono del usuario ya aparece en alguna
  // orden histórica que haya recibido descuento (misma persona, email distinto),
  // tampoco aplica. Compara últimos 10 dígitos para ignorar prefijos.
  const user = db.prepare('SELECT phone FROM users WHERE id = ?').get(userId)
  const phone = normalizePhone(user?.phone)
  if (phone) {
    const byPhone = db
      .prepare(
        `SELECT COUNT(*) as n FROM orders
         WHERE discount_amount > 0
           AND customer_phone IS NOT NULL
           AND REPLACE(REPLACE(REPLACE(customer_phone,'+',''),' ',''),'-','') LIKE ?`
      )
      .get('%' + phone)
    if (byPhone.n > 0) return { amount: 0 }
  }

  const amount = Math.round((subtotal * percent) / 100)
  return {
    amount,
    percent,
    reason: `Descuento primera compra ${percent}%`
  }
}

module.exports = { computeFirstPurchaseDiscount }
