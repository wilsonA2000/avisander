const express = require('express')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { subscribe } = require('../lib/eventBus')

const router = express.Router()

router.get('/admin', authenticateToken, requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  res.write(`event: ready\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`)

  const unsubscribe = subscribe((evt) => {
    res.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`)
  })

  // Heartbeat cada 25s para que Cloudflare/Fly no corten por idle.
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n')
  }, 25_000)

  req.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
    res.end()
  })
})

module.exports = router
