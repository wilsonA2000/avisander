// App Express exportable (sin listen) para reusar en server.js y tests.
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')
const path = require('path')

const logger = require('./lib/logger')
const { clientIp } = require('./lib/client-ip')

const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const categoryRoutes = require('./routes/categories')
const orderRoutes = require('./routes/orders')
const settingsRoutes = require('./routes/settings')
const uploadRoutes = require('./routes/upload')
const deliveryRoutes = require('./routes/delivery')
const recipeRoutes = require('./routes/recipes')
const mediaRoutes = require('./routes/media')
const paymentRoutes = require('./routes/payments')
const customerRoutes = require('./routes/customers')
const supplierRoutes = require('./routes/suppliers')
const purchaseRoutes = require('./routes/purchases')
const inventoryRoutes = require('./routes/inventory')
const reportsRoutes = require('./routes/reports')
const pqrsRoutes = require('./routes/pqrs')
const aiRoutes = require('./routes/ai')
const loyaltyRoutes = require('./routes/loyalty')
const analyticsRoutes = require('./routes/analytics')
const eventsRoutes = require('./routes/events')
const reviewsRoutes = require('./routes/reviews')

function createApp({ enableRateLimit = true } = {}) {
  const app = express()
  const isProd = process.env.NODE_ENV === 'production'

  // Cadena real en prod: Cliente → Cloudflare → Fly proxy → Express (2 hops).
  // Con trust proxy=1 Express veía la IP del edge de Fly y todos los visitantes
  // compartían "IP", lo que reventaba rate limits entre sí.
  app.set('trust proxy', 2)

  if (process.env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        customLogLevel: (_req, res, err) => {
          if (err || res.statusCode >= 500) return 'error'
          if (res.statusCode >= 400) return 'warn'
          return 'info'
        },
        serializers: {
          req: (req) => ({ method: req.method, url: req.url, id: req.id }),
          res: (res) => ({ statusCode: res.statusCode })
        }
      })
    )
  }

  app.use(
    helmet({
      contentSecurityPolicy: isProd
        ? {
            directives: {
              defaultSrc: ["'self'"],
              imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
              connectSrc: [
                "'self'",
                'https://wa.me',
                'https://maps.googleapis.com',
                'https://places.googleapis.com',
                'https://nominatim.openstreetmap.org',
                'https://checkout.bold.co',
                'https://integrations.api.bold.co',
                'https://cloudflareinsights.com',
                'https://static.cloudflareinsights.com'
              ],
              scriptSrc: [
                "'self'",
                'https://maps.googleapis.com',
                'https://maps.gstatic.com',
                'https://checkout.bold.co',
                'https://static.cloudflareinsights.com'
              ],
              styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
              mediaSrc: ["'self'", 'data:', 'blob:', 'https:'],
              frameSrc: [
                "'self'",
                'https://www.google.com',
                'https://www.youtube.com',
                'https://www.youtube-nocookie.com',
                'https://player.vimeo.com',
                'https://checkout.bold.co'
              ]
            }
          }
        : false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // YouTube/Vimeo verifican el dominio de incrustación vía referrer. Con
      // no-referrer (default de Helmet) rechazan con "Error 153".
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      // COOP=same-origin aísla la ventana y rompe la comunicación postMessage
      // con el iframe del reproductor.
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
    })
  )

  const allowedOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  // En desarrollo, aceptamos cualquier subdominio de los túneles de ngrok/cloudflare
  // para no tener que re-editar FRONTEND_URL cada vez que el túnel cambia de URL.
  // En producción esta regex nunca matchea — el dominio real va en FRONTEND_URL.
  const tunnelRegex = /^https:\/\/[a-z0-9-]+\.(ngrok-free\.app|ngrok\.app|ngrok\.io|trycloudflare\.com)$/
  const isDev = process.env.NODE_ENV !== 'production'
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (allowedOrigins.includes(origin)) return cb(null, true)
        if (isDev && tunnelRegex.test(origin)) return cb(null, true)
        return cb(new Error('Origen no permitido por CORS'))
      },
      credentials: true
    })
  )

  app.use(cookieParser())

  // El webhook de Bold necesita el body RAW para verificar HMAC-SHA256.
  // Si el express.json() lo parsea antes, perdemos la firma.
  // Saltamos esta ruta del parser global.
  app.use((req, res, next) => {
    if (req.originalUrl === '/api/payments/bold/webhook') return next()
    return express.json({ limit: '1mb' })(req, res, next)
  })

  if (enableRateLimit) {
    // En desarrollo subimos el máximo; tests E2E y HMR pueden disparar cientos de requests legítimas.
    const globalMax = process.env.NODE_ENV === 'production' ? 1500 : 3000
    app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: globalMax,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: clientIp,
        message: { error: 'Demasiadas solicitudes, intenta más tarde.' }
      })
    )
  }

  const authLimiter = enableRateLimit
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 10,
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: true,
        keyGenerator: clientIp,
        message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
      })
    : (_req, _res, next) => next()

  // En producción UPLOADS_PATH=/data/uploads (volumen persistente).
  const uploadsPath = process.env.UPLOADS_PATH || path.join(__dirname, 'uploads')
  app.use(
    '/uploads',
    express.static(uploadsPath, {
      dotfiles: 'deny',
      maxAge: '30d',
      index: false
    })
  )

  // Medios: dos capas con fallback.
  //   1) Archivos del repo (iconos 3D, Lotties, QRs de pagos) — siempre presentes.
  //   2) Archivos subidos dinámicamente (biblioteca, productos, videos, publicidad)
  //      viven en el volumen persistente. En prod MEDIA_PATH=/data/media.
  // Si un archivo no está en la capa 1, express.static cae a la 2. Si no está en
  // ninguna, 404.
  app.use(
    '/media',
    express.static(path.join(__dirname, 'media'), {
      dotfiles: 'deny',
      maxAge: '7d',
      index: false,
      fallthrough: true
    })
  )
  const mediaPath = process.env.MEDIA_PATH || path.join(__dirname, 'media')
  if (mediaPath !== path.join(__dirname, 'media')) {
    app.use(
      '/media',
      express.static(mediaPath, {
        dotfiles: 'deny',
        maxAge: '7d',
        index: false
      })
    )
  }

  app.use('/api/auth', authLimiter, authRoutes)
  app.use('/api/products', productRoutes)
  app.use('/api/categories', categoryRoutes)
  app.use('/api/orders', orderRoutes)
  app.use('/api/settings', settingsRoutes)
  app.use('/api/upload', uploadRoutes)
  app.use('/api/delivery', deliveryRoutes)
  app.use('/api/recipes', recipeRoutes)
  app.use('/api/media', mediaRoutes)
  app.use('/api/payments', paymentRoutes)
  app.use('/api/customers', customerRoutes)
  app.use('/api/suppliers', supplierRoutes)
  app.use('/api/purchases', purchaseRoutes)
  app.use('/api/inventory', inventoryRoutes)
  app.use('/api/reports', reportsRoutes)
  app.use('/api/pqrs', pqrsRoutes)
  app.use('/api/ai', aiRoutes)
  app.use('/api/loyalty', loyaltyRoutes)
  app.use('/api/analytics', analyticsRoutes)
  app.use('/api/events', eventsRoutes)
  app.use('/api/reviews', reviewsRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  // En producción, el mismo Express sirve el frontend buildeado (Vite → dist/).
  // Evita tener dos servicios/dominios y simplifica el deploy.
  // En dev, Vite corre aparte en :5173 y proxea /api a este backend.
  const frontendDist = path.resolve(__dirname, '..', 'frontend', 'dist')
  if (isProd && require('fs').existsSync(frontendDist)) {
    // Cache agresivo para assets con hash (/assets/*) — el contenido nunca cambia
    // porque cada deploy genera nuevos hashes. Pero index.html debe revalidarse
    // siempre para que los clientes ya cacheados no queden apuntando a chunks
    // que ya no existen tras un deploy (causa pantallas en blanco en rutas lazy).
    app.use(
      express.static(frontendDist, {
        index: 'index.html',
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache, must-revalidate')
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
          } else {
            res.setHeader('Cache-Control', 'public, max-age=3600')
          }
        }
      })
    )
    // SPA fallback: rutas del cliente (carrito, producto/:id, admin/*) devuelven el index.
    app.get(/^(?!\/api\/|\/uploads\/|\/media\/).*/, (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate')
      res.sendFile(path.join(frontendDist, 'index.html'))
    })
  }

  app.use((_req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado' })
  })

  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500

    if (err.name === 'ZodError') {
      return res.status(400).json({
        error: 'Datos inválidos',
        details: err.issues?.map((i) => ({ path: i.path.join('.'), message: i.message }))
      })
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }
    if (err.message && err.message.includes('CORS')) {
      return res.status(403).json({ error: err.message })
    }

    req.log ? req.log.error({ err }) : logger.error({ err })
    res.status(status).json({
      error: isProd ? 'Error interno del servidor' : err.message || 'Error interno del servidor'
    })
  })

  return app
}

module.exports = { createApp }
