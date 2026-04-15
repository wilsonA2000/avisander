// Cliente delgado para Replicate API (https://replicate.com/docs/reference/http).
// Solo usamos endpoints que necesitamos: predictions create/get + streaming sync.

const https = require('https')

const BASE = 'https://api.replicate.com/v1'
const TOKEN = process.env.REPLICATE_API_TOKEN

function isEnabled() {
  return !!TOKEN
}

function ensureToken() {
  if (!TOKEN) {
    const e = new Error('REPLICATE_API_TOKEN no configurado en backend/.env')
    e.status = 503
    throw e
  }
}

async function request(method, path, body, extraHeaders = {}) {
  ensureToken()
  const url = `${BASE}${path}`
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...extraHeaders
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const e = new Error(data?.detail || `Replicate ${res.status}`)
    e.status = res.status
    e.body = data
    throw e
  }
  return data
}

// Genera imagen sincronizada (espera hasta 60s con `Prefer: wait`).
async function generateImage({
  prompt,
  negative_prompt = '',
  aspect_ratio = '1:1',
  num_outputs = 1,
  model = 'flux-schnell',
  output_format = 'webp',
  output_quality = 85
}) {
  // FLUX schnell = rápido y barato (~$0.003). FLUX dev = más calidad (~$0.03).
  const owner = 'black-forest-labs'
  const data = await request(
    'POST',
    `/models/${owner}/${model}/predictions`,
    {
      input: {
        prompt,
        ...(negative_prompt ? { negative_prompt } : {}),
        aspect_ratio,
        num_outputs,
        output_format,
        output_quality
      }
    },
    { Prefer: 'wait=60' }
  )
  if (data.status === 'failed' || data.error) {
    const e = new Error(data.error || 'Replicate falló al generar')
    e.status = 500
    throw e
  }
  return {
    id: data.id,
    status: data.status,
    output: Array.isArray(data.output) ? data.output : data.output ? [data.output] : [],
    metrics: data.metrics
  }
}

// Quita el fondo de una imagen (salida = PNG transparente).
async function removeBackground(image_url) {
  // 851-labs/background-remover - $0.0023 por imagen.
  const data = await request(
    'POST',
    '/models/851-labs/background-remover/predictions',
    { input: { image: image_url, format: 'png' } },
    { Prefer: 'wait=60' }
  )
  if (data.status === 'failed' || data.error) {
    const e = new Error(data.error || 'Background remover falló')
    e.status = 500
    throw e
  }
  return {
    id: data.id,
    output: typeof data.output === 'string' ? data.output : data.output?.[0]
  }
}

// Upscale (mejora resolución 4x).
async function upscale(image_url) {
  // nightmareai/real-esrgan (~$0.0008 por imagen)
  const data = await request(
    'POST',
    '/models/nightmareai/real-esrgan/predictions',
    { input: { image: image_url, scale: 4, face_enhance: false } },
    { Prefer: 'wait=60' }
  )
  return { id: data.id, output: data.output }
}

module.exports = {
  isEnabled,
  generateImage,
  removeBackground,
  upscale
}
