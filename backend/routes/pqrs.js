// PQRS: Peticiones, Quejas, Reclamos, Sugerencias.
// Endpoint público para crear ticket (sin auth) + endpoints admin para listar/actualizar.

const express = require('express')
const rateLimit = require('express-rate-limit')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { pqrsCreateSchema, pqrsUpdateSchema } = require('../schemas/pqrs')
const { sendMail } = require('../lib/mailer')
const logger = require('../lib/logger')
const { clientIp } = require('../lib/client-ip')

const router = express.Router()

// Rate limit para formulario público (anti-spam).
const publicLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: clientIp,
  message: { error: 'Demasiadas solicitudes. Intenta en unos minutos.' }
})

// Crear ticket (público).
router.post('/', publicLimiter, validate(pqrsCreateSchema), (req, res, next) => {
  try {
    const { type, name, email, phone, message } = req.body
    const ip = req.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim()

    const result = db
      .prepare(
        `INSERT INTO pqrs_tickets (type, name, email, phone, message, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(type, name, email, phone || null, message, ip || null)

    const ticket = db.prepare('SELECT * FROM pqrs_tickets WHERE id = ?').get(result.lastInsertRowid)

    // Notificar al admin por correo (fire-and-forget).
    const adminEmail = db
      .prepare("SELECT value FROM settings WHERE key = 'admin_notification_email'")
      .get()?.value || process.env.ADMIN_NOTIFICATION_EMAIL

    if (adminEmail) {
      setImmediate(async () => {
        try {
          const typeLabel = { peticion: 'Petición', queja: 'Queja', reclamo: 'Reclamo', sugerencia: 'Sugerencia' }[type] || type
          await sendMail({
            to: adminEmail,
            subject: `[Avisander] Nueva ${typeLabel} de ${name}`,
            html: `
              <h2>${typeLabel} — #${ticket.id}</h2>
              <p><strong>De:</strong> ${name} &lt;${email}&gt;${phone ? ' · ' + phone : ''}</p>
              <p><strong>Mensaje:</strong></p>
              <blockquote style="border-left:3px solid #8B1F28;padding-left:12px;color:#555">${message.replace(/\n/g, '<br>')}</blockquote>
              <p style="color:#888;font-size:12px">Recibido: ${new Date().toISOString()}</p>
            `,
            text: `${typeLabel} #${ticket.id} de ${name} <${email}>\n\n${message}`
          })
        } catch (e) {
          logger.warn({ err: e.message }, 'Fallo enviando email de PQRS al admin')
        }
      })
    }

    res.status(201).json({ id: ticket.id, message: 'Ticket registrado. Te contactaremos pronto.' })
  } catch (error) {
    next(error)
  }
})

// Admin: listar
router.get('/', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const { type, status } = req.query
    const where = ['1=1']
    const params = []
    if (type) { where.push('type = ?'); params.push(type) }
    if (status) { where.push('status = ?'); params.push(status) }
    const rows = db
      .prepare(`SELECT * FROM pqrs_tickets WHERE ${where.join(' AND ')} ORDER BY created_at DESC`)
      .all(...params)
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

// Admin: detalle
router.get('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const t = db.prepare('SELECT * FROM pqrs_tickets WHERE id = ?').get(req.params.id)
    if (!t) return res.status(404).json({ error: 'Ticket no encontrado' })
    res.json(t)
  } catch (error) {
    next(error)
  }
})

// Admin: actualizar estado / notas
router.put('/:id', authenticateToken, requireAdmin, validate(pqrsUpdateSchema), (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM pqrs_tickets WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Ticket no encontrado' })
    const m = { ...existing, ...req.body }
    const resolvedAt = m.status === 'resolved' && !existing.resolved_at ? new Date().toISOString() : existing.resolved_at
    db.prepare(
      `UPDATE pqrs_tickets SET status = ?, admin_notes = ?, resolved_at = ? WHERE id = ?`
    ).run(m.status, m.admin_notes ?? null, resolvedAt, req.params.id)
    res.json(db.prepare('SELECT * FROM pqrs_tickets WHERE id = ?').get(req.params.id))
  } catch (error) {
    next(error)
  }
})

module.exports = router
