// Única vía para modificar products.stock. Garantiza kardex sincronizado
// (inventory_movements) porque ambas escrituras ocurren en la misma transacción.
//
// type: 'purchase' | 'sale' | 'adjustment' | 'waste' | 'return'
// quantity firmado: positivo suma stock, negativo resta.
//   - purchase:   +qty (recibe de proveedor)
//   - sale:       -qty (venta web/POS)
//   - adjustment: ±qty (corrección manual: inventario inicial, conteo físico)
//   - waste:      -qty (merma, caducidad)
//   - return:     +qty (devolución de cliente)

const { db } = require('../db/database')

const VALID_TYPES = new Set(['purchase', 'sale', 'adjustment', 'waste', 'return'])

function recordMovement({
  productId,
  type,
  quantity,
  referenceType = null,
  referenceId = null,
  notes = null,
  userId = null
}) {
  if (!VALID_TYPES.has(type)) {
    const e = new Error(`Tipo de movimiento inválido: ${type}`)
    e.status = 400
    throw e
  }
  if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity === 0) {
    const e = new Error('quantity debe ser un número distinto de cero')
    e.status = 400
    throw e
  }

  const tx = db.transaction(() => {
    const product = db.prepare('SELECT id, name, stock FROM products WHERE id = ?').get(productId)
    if (!product) {
      const e = new Error(`Producto ${productId} no existe`)
      e.status = 404
      throw e
    }
    const current = Number(product.stock) || 0
    const next = current + quantity
    if (next < 0) {
      const e = new Error(
        `Stock insuficiente para "${product.name}": actual ${current}, solicitado ${Math.abs(quantity)}`
      )
      e.status = 400
      e.code = 'insufficient_stock'
      e.product_id = product.id
      e.product_name = product.name
      e.stock = current
      e.requested = Math.abs(quantity)
      throw e
    }

    db.prepare('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(next, productId)

    const insert = db
      .prepare(
        `INSERT INTO inventory_movements
          (product_id, type, quantity, balance_after, reference_type, reference_id, notes, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(productId, type, quantity, next, referenceType, referenceId, notes, userId)

    return { id: insert.lastInsertRowid, balance_after: next }
  })

  return tx()
}

// Descuenta stock para todos los items de una orden aprobada.
// Convierte weight_grams en kg para órdenes de productos by_weight.
// Si algún item falla por stock insuficiente, deshace toda la operación.
function recordSaleFromOrder({ orderId, userId = null }) {
  const items = db
    .prepare(
      `SELECT oi.product_id, oi.product_name, oi.sale_type, oi.quantity, oi.weight_grams
       FROM order_items oi WHERE oi.order_id = ?`
    )
    .all(orderId)

  const tx = db.transaction(() => {
    const results = []
    for (const it of items) {
      if (!it.product_id) continue
      const qty =
        it.sale_type === 'by_weight' && it.weight_grams
          ? it.weight_grams / 1000
          : Number(it.quantity) || 0
      if (qty <= 0) continue
      results.push(
        recordMovement({
          productId: it.product_id,
          type: 'sale',
          quantity: -qty,
          referenceType: 'order',
          referenceId: orderId,
          notes: `Venta pedido #${orderId}`,
          userId
        })
      )
    }
    return results
  })
  return tx()
}

function getKardex(productId, limit = 100) {
  return db
    .prepare(
      `SELECT m.*, u.name as user_name
       FROM inventory_movements m
       LEFT JOIN users u ON m.user_id = u.id
       WHERE m.product_id = ?
       ORDER BY m.created_at DESC, m.id DESC LIMIT ?`
    )
    .all(productId, limit)
}

module.exports = {
  recordMovement,
  recordSaleFromOrder,
  getKardex
}
