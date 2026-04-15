const jwt = require('jsonwebtoken')
const { db } = require('../db/database')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Configura backend/.env antes de arrancar.')
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db
      .prepare('SELECT id, email, name, role, phone, address, avatar_url FROM users WHERE id = ?')
      .get(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    req.user = user
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'token_expired' })
    }
    return res.status(401).json({ error: 'Token inválido' })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' })
  }
  next()
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = db
        .prepare('SELECT id, email, name, role, phone, address, avatar_url FROM users WHERE id = ?')
        .get(decoded.userId)
      req.user = user
    } catch (_error) {
      // Token inválido o expirado: continuar sin user (ruta opcional)
    }
  }

  next()
}

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
}
