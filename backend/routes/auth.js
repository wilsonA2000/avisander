const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../db/database')
const { authenticateToken, JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

// Register
router.post('/register', (req, res) => {
  try {
    const { email, password, name, phone } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena son requeridos' })
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contrasena debe tener al menos 6 caracteres' })
    }

    // Check if email exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'El correo ya esta registrado' })
    }

    const passwordHash = bcrypt.hashSync(password, 10)

    const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, phone)
      VALUES (?, ?, ?, ?)
    `).run(email, passwordHash, name || null, phone || null)

    const user = db.prepare('SELECT id, email, name, phone, role FROM users WHERE id = ?')
      .get(result.lastInsertRowid)

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({ user, token })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Error al registrar usuario' })
  }
})

// Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contrasena son requeridos' })
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales invalidas' })
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' })

    const { password_hash, ...userWithoutPassword } = user
    res.json({ user: userWithoutPassword, token })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Error al iniciar sesion' })
  }
})

// Get current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Logout (client-side, just acknowledge)
router.post('/logout', (req, res) => {
  res.json({ message: 'Sesion cerrada' })
})

module.exports = router
