const jwt = require('jsonwebtoken')
const { db } = require('../db/database')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido. Configura backend/.env antes de arrancar.')
}

function extractToken(req) {
  if (req.cookies?.access_token) return req.cookies.access_token
  const authHeader = req.headers['authorization']
  return authHeader && authHeader.split(' ')[1]
}

function authenticateToken(req, res, next) {
  const token = extractToken(req)

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = db
      .prepare('SELECT id, email, name, role, phone, address, avatar_url, must_change_password, wholesaler_status, business_name, nit, business_type FROM users WHERE id = ?')
      .get(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' })
    }

    // Si el usuario tiene must_change_password=1 (admin recién creado, o tras
    // reset admin), solo puede llamar a /change-password y /logout. Cualquier
    // otra ruta devuelve 403 para forzar el cambio antes de operar.
    if (user.must_change_password === 1) {
      const path = req.originalUrl.split('?')[0]
      const allowed = ['/api/auth/change-password', '/api/auth/logout', '/api/auth/me']
      if (!allowed.includes(path)) {
        return res.status(403).json({
          error: 'Debes cambiar tu contraseña antes de continuar.',
          code: 'must_change_password'
        })
      }
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

function requireApprovedMayorista(req, res, next) {
  if (req.user?.role === 'admin') return next()
  if (req.user?.wholesaler_status !== 'approved') {
    return res.status(403).json({
      error: 'Acceso restringido a mayoristas aprobados.',
      code: 'wholesaler_not_approved'
    })
  }
  next()
}

function optionalAuth(req, res, next) {
  const token = extractToken(req)

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET)
      const user = db
        .prepare('SELECT id, email, name, role, phone, address, avatar_url, must_change_password, wholesaler_status, business_name, nit, business_type FROM users WHERE id = ?')
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
  requireApprovedMayorista,
  optionalAuth
}
