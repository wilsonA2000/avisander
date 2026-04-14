const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const fileType = require('file-type')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp'
}

// Usamos memoryStorage para poder inspeccionar magic bytes ANTES de escribir a disco.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo imágenes JPEG, PNG, GIF o WebP.'), false)
    }
    cb(null, true)
  }
})

function safeFilename(ext) {
  const rand = require('crypto').randomBytes(8).toString('hex')
  return `product-${Date.now()}-${rand}${ext}`
}

router.post(
  '/image',
  authenticateToken,
  requireAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No se proporcionó ninguna imagen' })
      }

      // Validación real por magic bytes (el MIME declarado es fácilmente falsificable).
      const detected = await fileType.fromBuffer(req.file.buffer)
      if (!detected || !ALLOWED_MIMES.includes(detected.mime)) {
        return res.status(400).json({ error: 'El contenido del archivo no corresponde a una imagen válida.' })
      }
      if (detected.mime !== req.file.mimetype) {
        return res.status(400).json({ error: 'El tipo declarado no coincide con el contenido real del archivo.' })
      }

      const filename = safeFilename(EXT_BY_MIME[detected.mime])
      const destPath = path.join(uploadsDir, filename)

      // Doble check: el path resuelto debe seguir dentro de uploadsDir (anti path-traversal)
      if (!destPath.startsWith(uploadsDir + path.sep)) {
        return res.status(400).json({ error: 'Ruta de archivo inválida.' })
      }

      await fs.promises.writeFile(destPath, req.file.buffer)
      res.json({ url: `/uploads/${filename}` })
    } catch (error) {
      next(error)
    }
  }
)

// Manejo específico de errores de multer
router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es muy grande. Máximo 5MB.' })
    }
    return res.status(400).json({ error: error.message })
  }
  if (error && error.message) {
    return res.status(400).json({ error: error.message })
  }
  next(error)
})

module.exports = router
