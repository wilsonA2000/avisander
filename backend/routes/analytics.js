const express = require('express')
const rateLimit = require('express-rate-limit')
const { db } = require('../db/database')
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { trackSchema } = require('../schemas/analytics')

const router = express.Router()

const trackLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipFailedRequests: true
})

// Heurística de bots: lo suficientemente amplia para bloquear crawlers conocidos
// sin perseguirlos con una lista infinita. Cualquier UA que matchee se guarda
// igual pero con is_bot=1 — así queda registro sin contaminar las métricas.
const BOT_REGEX = /bot|crawl|slurp|spider|mediapartners|facebookexternalhit|bingpreview|yandex|baiduspider|duckduckbot|applebot|whatsapp|telegrambot|twitterbot|linkedinbot|discordbot/i

// POST /api/analytics/track
// Público. El frontend llama esto en cada cambio de ruta con su session_id
// (generado en localStorage). Si viene un admin autenticado, NO registramos
// — no queremos que el dueño cuente como visita.
router.post('/track', trackLimiter, optionalAuth, validate(trackSchema), (req, res) => {
  try {
    if (req.user?.role === 'admin') return res.json({ ok: true, skipped: 'admin' })

    const { session_id, path, referrer } = req.body

    const ua = String(req.headers['user-agent'] || '').slice(0, 500)
    const isBot = BOT_REGEX.test(ua) ? 1 : 0

    db.prepare(
      `INSERT INTO page_visits (session_id, user_id, path, referrer, user_agent, is_bot)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      String(session_id).slice(0, 120),
      req.user?.id || null,
      String(path).slice(0, 500),
      referrer ? String(referrer).slice(0, 500) : null,
      ua,
      isBot
    )
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: 'track failed' })
  }
})

// GET /api/analytics/summary
// Admin. Devuelve snapshot ligero para el dashboard.
router.get('/summary', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    // "Ahora navegando": sesiones únicas con actividad en los últimos 5 min.
    const activeNow = db.prepare(
      `SELECT COUNT(DISTINCT session_id) AS n
       FROM page_visits
       WHERE is_bot = 0
         AND created_at >= datetime('now', '-5 minutes')`
    ).get().n

    // Hoy: pageviews totales + visitantes únicos (por session_id).
    const today = db.prepare(
      `SELECT COUNT(*) AS visits, COUNT(DISTINCT session_id) AS unique_sessions
       FROM page_visits
       WHERE is_bot = 0
         AND date(created_at, 'localtime') = date('now', 'localtime')`
    ).get()

    // Últimos 7 días (incluye hoy), agrupados por día local.
    const last7 = db.prepare(
      `SELECT date(created_at, 'localtime') AS day,
              COUNT(*) AS visits,
              COUNT(DISTINCT session_id) AS unique_sessions
       FROM page_visits
       WHERE is_bot = 0
         AND created_at >= datetime('now', 'localtime', '-6 days', 'start of day')
       GROUP BY day
       ORDER BY day ASC`
    ).all()

    // Top páginas del día actual.
    const topPaths = db.prepare(
      `SELECT path, COUNT(*) AS visits
       FROM page_visits
       WHERE is_bot = 0
         AND date(created_at, 'localtime') = date('now', 'localtime')
       GROUP BY path
       ORDER BY visits DESC
       LIMIT 10`
    ).all()

    // Total histórico (para tener un número grande aspiracional).
    const totalVisits = db.prepare(
      `SELECT COUNT(*) AS n FROM page_visits WHERE is_bot = 0`
    ).get().n

    res.json({
      active_now: activeNow,
      today: { visits: today.visits, unique: today.unique_sessions },
      last_7_days: last7.map((r) => ({ date: r.day, visits: r.visits, unique: r.unique_sessions })),
      top_paths: topPaths,
      total_visits: totalVisits,
      generated_at: new Date().toISOString()
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router
