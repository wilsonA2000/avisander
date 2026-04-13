const express = require('express')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

const db = require('./db/database')
const authRoutes = require('./routes/auth')
const productRoutes = require('./routes/products')
const categoryRoutes = require('./routes/categories')
const orderRoutes = require('./routes/orders')
const settingsRoutes = require('./routes/settings')
const uploadRoutes = require('./routes/upload')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/upload', uploadRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ error: 'Error interno del servidor' })
})

// Initialize database and start server
db.initialize()

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
  console.log(`API disponible en http://localhost:${PORT}/api`)
})
