const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const {
  wholesalerRequestSchema,
  wholesalerRejectSchema
} = require('../schemas/auth')

const router = express.Router()

const STATUS_VALUES = ['pending', 'approved', 'rejected', 'revoked']

function publicProfile(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    business_name: row.business_name,
    nit: row.nit,
    business_type: row.business_type,
    wholesaler_status: row.wholesaler_status,
    wholesaler_requested_at: row.wholesaler_requested_at,
    wholesaler_approved_at: row.wholesaler_approved_at,
    wholesaler_rejection_reason: row.wholesaler_rejection_reason,
    created_at: row.created_at
  }
}

router.get('/me', authenticateToken, (req, res, next) => {
  try {
    const row = db
      .prepare(
        `SELECT id, name, email, phone, business_name, nit, business_type,
                wholesaler_status, wholesaler_requested_at, wholesaler_approved_at,
                wholesaler_rejection_reason, created_at
         FROM users WHERE id = ?`
      )
      .get(req.user.id)
    res.json({ wholesaler: publicProfile(row) })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/request',
  authenticateToken,
  validate(wholesalerRequestSchema),
  (req, res, next) => {
    try {
      const current = db
        .prepare('SELECT wholesaler_status FROM users WHERE id = ?')
        .get(req.user.id)
      if (current?.wholesaler_status === 'pending') {
        return res.status(400).json({ error: 'Ya tienes una solicitud en revisión.' })
      }
      if (current?.wholesaler_status === 'approved') {
        return res.status(400).json({ error: 'Ya estás aprobado como mayorista.' })
      }

      const { business_name, nit, business_type } = req.body
      db.prepare(
        `UPDATE users
            SET wholesaler_status = 'pending',
                wholesaler_requested_at = CURRENT_TIMESTAMP,
                wholesaler_rejection_reason = NULL,
                business_name = ?, nit = ?, business_type = ?,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
      ).run(business_name, nit, business_type, req.user.id)

      const row = db
        .prepare(
          `SELECT id, name, email, phone, business_name, nit, business_type,
                  wholesaler_status, wholesaler_requested_at, wholesaler_approved_at,
                  wholesaler_rejection_reason, created_at
           FROM users WHERE id = ?`
        )
        .get(req.user.id)
      res.status(201).json({ wholesaler: publicProfile(row) })
    } catch (error) {
      next(error)
    }
  }
)

// Admin
router.get('/admin/requests', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const status = req.query.status
    let where = '1=1'
    const params = []
    if (status === 'pending' || status === 'approved' || status === 'rejected' || status === 'revoked') {
      where = 'wholesaler_status = ?'
      params.push(status)
    } else if (status === 'any') {
      where = 'wholesaler_status IS NOT NULL'
    } else {
      // default: pendientes (lo más útil para el admin)
      where = "wholesaler_status = 'pending'"
    }
    const rows = db
      .prepare(
        `SELECT id, name, email, phone, business_name, nit, business_type,
                wholesaler_status, wholesaler_requested_at, wholesaler_approved_at,
                wholesaler_rejection_reason, created_at
         FROM users
         WHERE ${where}
         ORDER BY wholesaler_requested_at DESC, id DESC`
      )
      .all(...params)
    const counts = db
      .prepare(
        `SELECT
            SUM(CASE WHEN wholesaler_status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN wholesaler_status = 'approved' THEN 1 ELSE 0 END) AS approved,
            SUM(CASE WHEN wholesaler_status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
            SUM(CASE WHEN wholesaler_status = 'revoked' THEN 1 ELSE 0 END) AS revoked
         FROM users`
      )
      .get()
    res.json({
      items: rows.map(publicProfile),
      counts: {
        pending: counts?.pending || 0,
        approved: counts?.approved || 0,
        rejected: counts?.rejected || 0,
        revoked: counts?.revoked || 0
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/admin/:userId/approve', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = Number(req.params.userId)
    const target = db.prepare('SELECT id, wholesaler_status FROM users WHERE id = ?').get(userId)
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (!target.wholesaler_status) {
      return res.status(400).json({ error: 'Este usuario no ha solicitado acceso mayorista.' })
    }
    db.prepare(
      `UPDATE users
          SET wholesaler_status = 'approved',
              wholesaler_approved_at = CURRENT_TIMESTAMP,
              wholesaler_approved_by = ?,
              wholesaler_rejection_reason = NULL,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).run(req.user.id, userId)
    res.json({ message: 'Mayorista aprobado', user_id: userId })
  } catch (error) {
    next(error)
  }
})

router.post(
  '/admin/:userId/reject',
  authenticateToken,
  requireAdmin,
  validate(wholesalerRejectSchema),
  (req, res, next) => {
    try {
      const userId = Number(req.params.userId)
      const target = db.prepare('SELECT id, wholesaler_status FROM users WHERE id = ?').get(userId)
      if (!target) return res.status(404).json({ error: 'Usuario no encontrado' })
      db.prepare(
        `UPDATE users
            SET wholesaler_status = 'rejected',
                wholesaler_rejection_reason = ?,
                wholesaler_approved_at = NULL,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`
      ).run(req.body.reason, userId)
      res.json({ message: 'Solicitud rechazada', user_id: userId })
    } catch (error) {
      next(error)
    }
  }
)

router.post('/admin/:userId/revoke', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const userId = Number(req.params.userId)
    const target = db.prepare('SELECT id, wholesaler_status FROM users WHERE id = ?').get(userId)
    if (!target) return res.status(404).json({ error: 'Usuario no encontrado' })
    if (target.wholesaler_status !== 'approved') {
      return res.status(400).json({ error: 'Solo se puede revocar a un mayorista aprobado.' })
    }
    db.prepare(
      `UPDATE users
          SET wholesaler_status = 'revoked',
              wholesaler_approved_at = NULL,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`
    ).run(userId)
    res.json({ message: 'Acceso revocado', user_id: userId })
  } catch (error) {
    next(error)
  }
})

module.exports = router
