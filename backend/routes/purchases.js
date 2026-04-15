const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { purchaseCreateSchema, purchaseUpdateSchema } = require('../schemas/purchase')
const inventory = require('../lib/inventory')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

router.get('/', (req, res, next) => {
  try {
    const { status, supplier_id } = req.query
    const where = ['1=1']
    const params = []
    if (status) {
      where.push('p.status = ?')
      params.push(status)
    }
    if (supplier_id) {
      where.push('p.supplier_id = ?')
      params.push(Number(supplier_id))
    }
    const rows = db
      .prepare(
        `SELECT p.*, s.name as supplier_name,
                (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id = p.id) AS items_count
         FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id
         WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC`
      )
      .all(...params)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', (req, res, next) => {
  try {
    const purchase = db
      .prepare(
        `SELECT p.*, s.name as supplier_name
         FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id
         WHERE p.id = ?`
      )
      .get(req.params.id)
    if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' })
    purchase.items = db
      .prepare(
        `SELECT pi.*, pr.name as product_name, pr.image_url
         FROM purchase_items pi LEFT JOIN products pr ON pr.id = pi.product_id
         WHERE pi.purchase_id = ?`
      )
      .all(req.params.id)
    res.json(purchase)
  } catch (error) {
    next(error)
  }
})

router.post('/', validate(purchaseCreateSchema), (req, res, next) => {
  try {
    const { supplier_id, reference, notes, items } = req.body
    const total = items.reduce((acc, it) => acc + it.quantity * it.unit_cost, 0)

    const tx = db.transaction(() => {
      const insert = db
        .prepare(
          `INSERT INTO purchases (supplier_id, reference, status, total, notes, created_by)
           VALUES (?, ?, 'draft', ?, ?, ?)`
        )
        .run(supplier_id || null, reference || null, total, notes || null, req.user.id)
      const purchaseId = insert.lastInsertRowid
      const insertItem = db.prepare(
        `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
         VALUES (?, ?, ?, ?, ?)`
      )
      for (const it of items) {
        insertItem.run(purchaseId, it.product_id, it.quantity, it.unit_cost, it.quantity * it.unit_cost)
      }
      return purchaseId
    })
    const id = tx()
    res.status(201).json(db.prepare('SELECT * FROM purchases WHERE id = ?').get(id))
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validate(purchaseUpdateSchema), (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Compra no encontrada' })
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Solo las compras en borrador se pueden editar' })
    }
    const m = { ...existing, ...req.body }
    const tx = db.transaction(() => {
      if (req.body.items) {
        db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(req.params.id)
        const insertItem = db.prepare(
          `INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, subtotal)
           VALUES (?, ?, ?, ?, ?)`
        )
        for (const it of req.body.items) {
          insertItem.run(
            req.params.id,
            it.product_id,
            it.quantity,
            it.unit_cost,
            it.quantity * it.unit_cost
          )
        }
        m.total = req.body.items.reduce((acc, it) => acc + it.quantity * it.unit_cost, 0)
      }
      db.prepare(
        `UPDATE purchases SET supplier_id = ?, reference = ?, notes = ?, total = ? WHERE id = ?`
      ).run(
        m.supplier_id ?? null,
        m.reference ?? null,
        m.notes ?? null,
        m.total,
        req.params.id
      )
    })
    tx()
    res.json(db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id))
  } catch (error) {
    next(error)
  }
})

// Marcar como recibida: incrementa stock, actualiza cost_price con promedio ponderado
// y registra movimiento en kardex por cada item.
router.post('/:id/receive', (req, res, next) => {
  try {
    const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id)
    if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' })
    if (purchase.status !== 'draft') {
      return res.status(400).json({ error: `Compra ya está en estado "${purchase.status}"` })
    }
    const items = db
      .prepare('SELECT * FROM purchase_items WHERE purchase_id = ?')
      .all(req.params.id)
    if (items.length === 0) {
      return res.status(400).json({ error: 'La compra no tiene items' })
    }

    const tx = db.transaction(() => {
      for (const it of items) {
        // Promedio ponderado: cost_price_nuevo = (stock*cost + qty*unit_cost) / (stock+qty)
        const prod = db
          .prepare('SELECT stock, cost_price FROM products WHERE id = ?')
          .get(it.product_id)
        const curStock = Number(prod?.stock) || 0
        const curCost = Number(prod?.cost_price) || 0
        const newStock = curStock + it.quantity
        const avgCost =
          newStock > 0
            ? (curStock * curCost + it.quantity * it.unit_cost) / newStock
            : it.unit_cost
        db.prepare('UPDATE products SET cost_price = ? WHERE id = ?').run(avgCost, it.product_id)

        inventory.recordMovement({
          productId: it.product_id,
          type: 'purchase',
          quantity: it.quantity,
          referenceType: 'purchase',
          referenceId: purchase.id,
          notes: `Compra #${purchase.id}${purchase.reference ? ' ref ' + purchase.reference : ''}`,
          userId: req.user.id
        })
      }
      db.prepare(
        `UPDATE purchases SET status = 'received', received_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(req.params.id)
    })
    tx()
    res.json(db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id))
  } catch (error) {
    next(error)
  }
})

router.post('/:id/pay', (req, res, next) => {
  try {
    const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id)
    if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' })
    if (purchase.status !== 'received') {
      return res.status(400).json({ error: 'Solo compras recibidas se pueden marcar como pagadas' })
    }
    db.prepare(`UPDATE purchases SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(req.params.id)
    res.json(db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', (req, res, next) => {
  try {
    const purchase = db.prepare('SELECT * FROM purchases WHERE id = ?').get(req.params.id)
    if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' })
    if (purchase.status !== 'draft') {
      // Para preservar kardex, las compras recibidas se cancelan, no se borran.
      db.prepare(`UPDATE purchases SET status = 'cancelled' WHERE id = ?`).run(req.params.id)
      return res.json({ message: 'Compra cancelada (el stock ya ingresado no se revierte automáticamente)' })
    }
    db.prepare('DELETE FROM purchases WHERE id = ?').run(req.params.id)
    res.json({ message: 'Compra eliminada' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
