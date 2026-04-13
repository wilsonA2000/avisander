const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { authenticateToken, requireAdmin } = require('../middleware/auth')

const router = express.Router()

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, 'product-' + uniqueSuffix + ext)
  }
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imagenes (JPEG, PNG, GIF, WebP).'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Upload image (admin only)
router.post('/image', authenticateToken, requireAdmin, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporciono ninguna imagen' })
    }

    const imageUrl = `/uploads/${req.file.filename}`
    res.json({ url: imageUrl })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Error al subir imagen' })
  }
})

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es muy grande. Maximo 5MB.' })
    }
    return res.status(400).json({ error: error.message })
  }
  if (error) {
    return res.status(400).json({ error: error.message })
  }
  next()
})

module.exports = router
