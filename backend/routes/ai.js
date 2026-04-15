// Rutas admin para generación de imágenes con IA via Replicate.
// Todas requieren autenticación admin.

const express = require('express')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { db } = require('../db/database')
const replicate = require('../lib/replicate')
const logger = require('../lib/logger')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

const AI_DIR = path.join(__dirname, '..', 'media', 'ia')
fs.mkdirSync(AI_DIR, { recursive: true })

// Tabla simple para historial (idempotente al boot).
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    kind TEXT NOT NULL,
    prompt TEXT,
    model TEXT,
    aspect_ratio TEXT,
    source_url TEXT,
    output_url TEXT NOT NULL,
    local_url TEXT,
    cost_estimate_usd REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE INDEX IF NOT EXISTS idx_ai_user ON ai_assets(user_id, created_at);
`)

// Descarga la URL de Replicate y guarda local para poder usarla con `/media/ia/...`.
async function persistOutput(remoteUrl, ext = 'webp') {
  const res = await fetch(remoteUrl)
  if (!res.ok) throw new Error(`No se pudo bajar el output: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const filename = `ai-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
  fs.writeFileSync(path.join(AI_DIR, filename), buf)
  return `/media/ia/${filename}`
}

router.get('/status', (_req, res) => {
  res.json({ enabled: replicate.isEnabled() })
})

router.post('/generate-image', async (req, res, next) => {
  try {
    const {
      prompt,
      negative_prompt,
      aspect_ratio = '1:1',
      num_outputs = 1,
      model = 'flux-schnell'
    } = req.body
    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'Prompt requerido (mínimo 5 caracteres).' })
    }
    const out = await replicate.generateImage({
      prompt: prompt.trim(),
      negative_prompt,
      aspect_ratio,
      num_outputs: Math.min(4, Math.max(1, parseInt(num_outputs) || 1)),
      model: model === 'flux-dev' ? 'flux-dev' : 'flux-schnell'
    })

    const persisted = await Promise.all(
      out.output.map((u) => persistOutput(u, 'webp'))
    )
    const stmt = db.prepare(
      `INSERT INTO ai_assets (user_id, kind, prompt, model, aspect_ratio, output_url, local_url, cost_estimate_usd)
       VALUES (?, 'generate', ?, ?, ?, ?, ?, ?)`
    )
    const cost = (model === 'flux-dev' ? 0.03 : 0.003) * out.output.length
    persisted.forEach((local, i) => {
      stmt.run(req.user.id, prompt, model, aspect_ratio, out.output[i], local, cost / out.output.length)
    })
    res.json({
      id: out.id,
      images: persisted,
      remote: out.output,
      cost_estimate_usd: cost
    })
  } catch (error) {
    logger.error({ err: error?.message, body: error?.body }, 'AI generate-image error')
    next(error)
  }
})

router.post('/remove-background', async (req, res, next) => {
  try {
    const { image_url } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url requerido' })
    const out = await replicate.removeBackground(image_url)
    if (!out.output) return res.status(500).json({ error: 'Sin output' })
    const local = await persistOutput(out.output, 'png')
    db.prepare(
      `INSERT INTO ai_assets (user_id, kind, source_url, output_url, local_url, cost_estimate_usd)
       VALUES (?, 'remove-bg', ?, ?, ?, ?)`
    ).run(req.user.id, image_url, out.output, local, 0.0023)
    res.json({ id: out.id, image: local, remote: out.output, cost_estimate_usd: 0.0023 })
  } catch (error) {
    next(error)
  }
})

router.post('/upscale', async (req, res, next) => {
  try {
    const { image_url } = req.body
    if (!image_url) return res.status(400).json({ error: 'image_url requerido' })
    const out = await replicate.upscale(image_url)
    if (!out.output) return res.status(500).json({ error: 'Sin output' })
    const local = await persistOutput(out.output, 'png')
    db.prepare(
      `INSERT INTO ai_assets (user_id, kind, source_url, output_url, local_url, cost_estimate_usd)
       VALUES (?, 'upscale', ?, ?, ?, ?)`
    ).run(req.user.id, image_url, out.output, local, 0.0008)
    res.json({ id: out.id, image: local, remote: out.output, cost_estimate_usd: 0.0008 })
  } catch (error) {
    next(error)
  }
})

router.get('/history', (_req, res, next) => {
  try {
    const rows = db
      .prepare(
        `SELECT id, kind, prompt, model, aspect_ratio, source_url, local_url, output_url,
                cost_estimate_usd, created_at
         FROM ai_assets ORDER BY created_at DESC LIMIT 50`
      )
      .all()
    res.json(rows)
  } catch (error) {
    next(error)
  }
})

module.exports = router
