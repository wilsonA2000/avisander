const express = require('express')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Get all settings (public)
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    for (const row of rows) {
      settings[row.key] = row.value
    }
    res.json(settings)
  } catch (error) {
    console.error('Get settings error:', error)
    res.status(500).json({ error: 'Error al obtener configuracion' })
  }
})

// Update settings (admin only)
router.put('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const settings = req.body

    const upsert = db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `)

    for (const [key, value] of Object.entries(settings)) {
      upsert.run(key, String(value))
    }

    // Return updated settings
    const rows = db.prepare('SELECT key, value FROM settings').all()
    const result = {}
    for (const row of rows) {
      result[row.key] = row.value
    }

    res.json(result)
  } catch (error) {
    console.error('Update settings error:', error)
    res.status(500).json({ error: 'Error al actualizar configuracion' })
  }
})

module.exports = router
