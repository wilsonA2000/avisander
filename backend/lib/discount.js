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

  // Redondeo a pesos enteros (COP).
  const amount = Math.round((subtotal * percent) / 100)
  return {
    amount,
    percent,
    reason: `Descuento primera compra ${percent}%`
  }
}

module.exports = { computeFirstPurchaseDiscount }
