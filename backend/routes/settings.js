const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { settingsUpdateSchema, PUBLIC_KEYS } = require('../schemas/settings')

const router = express.Router()

// Público: solo whitelist de claves seguras para el storefront
router.get('/', (_req, res, next) => {
  try {
    const placeholders = PUBLIC_KEYS.map(() => '?').join(',')
    const rows = db
      .prepare(`SELECT key, value FROM settings WHERE key IN (${placeholders})`)
      .all(...PUBLIC_KEYS)
    const settings = {}
    for (const row of rows) settings[row.key] = row.value
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

// Admin: lista completa
router.get('/all', authenticateToken, requireAdmin, (_req, res, next) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    for (const row of rows) settings[row.key] = row.value
    res.json(settings)
  } catch (error) {
    next(error)
  }
})

router.put(
  '/',
  authenticateToken,
  requireAdmin,
  validate(settingsUpdateSchema),
  (req, res, next) => {
    try {
      const upsert = db.prepare(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
      )
      for (const [key, value] of Object.entries(req.body)) {
        upsert.run(key, String(value))
      }
      const rows = db.prepare('SELECT key, value FROM settings').all()
      const result = {}
      for (const row of rows) result[row.key] = row.value
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
)

module.exports = router
