const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { supplierCreateSchema, supplierUpdateSchema } = require('../schemas/supplier')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

router.get('/', (_req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT s.*,
                (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id) AS purchases_count,
                (SELECT COALESCE(SUM(p.total), 0) FROM purchases p
                  WHERE p.supplier_id = s.id AND p.status IN ('received','paid')) AS total_purchased
         FROM suppliers s ORDER BY s.is_active DESC, s.name COLLATE NOCASE ASC`
      )
      .all()
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', (req, res, next) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id)
    if (!supplier) return res.status(404).json({ error: 'Proveedor no encontrado' })
    supplier.purchases = db
      .prepare(
        'SELECT id, reference, status, total, received_at, created_at FROM purchases WHERE supplier_id = ? ORDER BY created_at DESC LIMIT 50'
      )
      .all(req.params.id)
    res.json(supplier)
  } catch (error) {
    next(error)
  }
})

router.post('/', validate(supplierCreateSchema), (req, res, next) => {
  try {
    const b = req.body
    const result = db
      .prepare(
        `INSERT INTO suppliers (name, nit, contact_name, phone, email, address, notes, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        b.name,
        b.nit || null,
        b.contact_name || null,
        b.phone || null,
        b.email || null,
        b.address || null,
        b.notes || null,
        b.is_active === false ? 0 : 1
      )
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json(supplier)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', validate(supplierUpdateSchema), (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Proveedor no encontrado' })
    const m = { ...existing, ...req.body }
    db.prepare(
      `UPDATE suppliers SET name=?, nit=?, contact_name=?, phone=?, email=?, address=?, notes=?, is_active=?
       WHERE id=?`
    ).run(
      m.name,
      m.nit ?? null,
      m.contact_name ?? null,
      m.phone ?? null,
      m.email ?? null,
      m.address ?? null,
      m.notes ?? null,
      m.is_active === false ? 0 : 1,
      req.params.id
    )
    res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id))
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', (req, res, next) => {
  try {
    const used = db.prepare('SELECT 1 FROM purchases WHERE supplier_id = ? LIMIT 1').get(req.params.id)
    if (used) {
      // Soft delete: proveedor con compras no se elimina para preservar historial.
      db.prepare('UPDATE suppliers SET is_active = 0 WHERE id = ?').run(req.params.id)
      return res.json({ message: 'Proveedor desactivado (tenía compras asociadas)' })
    }
    db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id)
    res.json({ message: 'Proveedor eliminado' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
