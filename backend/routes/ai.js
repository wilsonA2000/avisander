// Rutas admin para generación de imágenes con IA via Replicate.
// Todas requieren autenticación admin.

const express = require('express')
const rateLimit = require('express-rate-limit')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const { authenticateToken, requireAdmin } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { aiGenerateImageSchema, aiImageUrlSchema, aiAssistantSchema } = require('../schemas/ai')
const { db } = require('../db/database')
const replicate = require('../lib/replicate')
const logger = require('../lib/logger')

const router = express.Router()

router.use(authenticateToken, requireAdmin)

const aiLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `user:${req.user?.id || 'anon'}`,
  message: { error: 'Has alcanzado el límite de solicitudes de IA por hora. Intenta más tarde.' }
})

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

router.post('/generate-image', aiLimiter, validate(aiGenerateImageSchema), async (req, res, next) => {
  try {
    const { prompt, negative_prompt, aspect_ratio, num_outputs, model } = req.body
    const out = await replicate.generateImage({
      prompt,
      negative_prompt,
      aspect_ratio,
      num_outputs,
      model
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

router.post('/remove-background', aiLimiter, validate(aiImageUrlSchema), async (req, res, next) => {
  try {
    const { image_url } = req.body
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

router.post('/upscale', aiLimiter, validate(aiImageUrlSchema), async (req, res, next) => {
  try {
    const { image_url } = req.body
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

// Guardar imagen editada desde el editor Filerobot del frontend.
// Recibe un archivo via multipart/form-data, lo persiste en media/ia/ y
// registra en ai_assets con kind='edited'.
const multer = require('multer')
const editUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

router.post('/save-edited', editUpload.single('image'), (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió archivo' })
    const ext = req.file.originalname?.split('.').pop() || 'png'
    const filename = `edited-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`
    fs.writeFileSync(path.join(AI_DIR, filename), req.file.buffer)
    const localUrl = `/media/ia/${filename}`

    db.prepare(
      `INSERT INTO ai_assets (user_id, kind, output_url, local_url, cost_estimate_usd)
       VALUES (?, 'edited', ?, ?, 0)`
    ).run(req.user.id, localUrl, localUrl)

    res.json({ url: localUrl })
  } catch (error) {
    next(error)
  }
})

// Estado del asistente AI (Claude)
const anthropic = require('../lib/anthropic')

router.get('/assistant/status', (_req, res) => {
  res.json({ enabled: anthropic.isEnabled() })
})

// Generar contenido con Claude
const CONTENT_TYPES = {
  description: {
    system: 'Eres el copywriter de Avisander, una carnicería premium colombiana en Bucaramanga. Escribes descripciones de producto profesionales, atractivas y concisas en español colombiano. Máximo 3 párrafos cortos. Resalta frescura, calidad y versatilidad culinaria.',
    buildPrompt: (product) => `Escribe una descripción de producto para: "${product.name}" (categoría: ${product.category_name || 'general'}, precio: $${product.price}). ${product.description || ''}`
  },
  caption: {
    system: 'Eres el community manager de Avisander, carnicería premium en Bucaramanga. Escribes captions para Instagram en español colombiano: enganchadoras, con emojis relevantes, máximo 3 párrafos + 15-20 hashtags relevantes al final. Tono cercano y apetitoso.',
    buildPrompt: (product) => `Escribe un caption de Instagram para promocionar: "${product.name}" a $${Number(product.price).toLocaleString('es-CO')} COP. ${product.description || ''}`
  },
  seo: {
    system: 'Eres experto en SEO para e-commerce colombiano. Genera un meta title (máx 60 chars) y meta description (máx 155 chars) en español para la página de producto. Incluye la ciudad Bucaramanga y términos de búsqueda relevantes.',
    buildPrompt: (product) => `Genera meta title y meta description SEO para el producto: "${product.name}" de la carnicería Avisander en Bucaramanga. Categoría: ${product.category_name || 'carnes'}. Precio: $${product.price}.`
  },
  recipe: {
    system: 'Eres un chef colombiano experto en carnes. Sugieres recetas prácticas y deliciosas usando los cortes de Avisander. Formato: nombre de la receta, ingredientes (con cantidades), preparación paso a paso, tips. Escribe en español colombiano casual pero profesional.',
    buildPrompt: (product) => `Sugiere una receta usando "${product.name}" como ingrediente principal. Que sea una receta colombiana o latinoamericana popular.`
  },
  custom: {
    system: 'Eres el asistente de marketing de Avisander, una carnicería premium colombiana en Bucaramanga. Ayudas con cualquier tarea de contenido: promociones, WhatsApp, emails, redes sociales, menús. Responde en español colombiano.',
    buildPrompt: (_product, customPrompt) => customPrompt
  }
}

router.post('/assistant/generate', aiLimiter, validate(aiAssistantSchema), async (req, res, next) => {
  try {
    if (!anthropic.isEnabled()) {
      return res.status(400).json({ error: 'ANTHROPIC_API_KEY no configurada en backend/.env' })
    }
    const { type, product_id, prompt: customPrompt } = req.body
    const config = CONTENT_TYPES[type]

    let product = { name: '', price: 0, category_name: '', description: '' }
    if (product_id) {
      const row = db.prepare('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?').get(product_id)
      if (row) product = row
    }

    const userMessage = config.buildPrompt(product, customPrompt || '')
    const result = await anthropic.generateContent({
      systemPrompt: config.system,
      userMessage
    })

    res.json(result)
  } catch (error) {
    logger.error({ err: error }, 'Claude generate error')
    next(error)
  }
})

module.exports = router
