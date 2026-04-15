const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const { db } = require('../db/database')
const { authenticateToken } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema
} = require('../schemas/auth')
const { profileUpdateSchema } = require('../schemas/user')
const {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TTL_SECONDS
} = require('../lib/tokens')
const { sendMail, passwordResetEmail } = require('../lib/mailer')
const logger = require('../lib/logger')

const router = express.Router()

const BCRYPT_ROUNDS = 12

function sanitizeUser(user) {
  if (!user) return null
  const { password_hash, ...rest } = user
  return rest
}

function issueTokens(userId) {
  return {
    token: signAccessToken(userId),
    refreshToken: generateRefreshToken(userId),
    expiresIn: ACCESS_TTL_SECONDS
  }
}

// Register
router.post('/register', validate(registerSchema), (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email)
    if (existing) {
      return res.status(400).json({ error: 'El correo ya está registrado' })
    }

    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)

    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name, phone) VALUES (?, ?, ?, ?)'
      )
      .run(email, passwordHash, name || null, phone || null)

    const user = db
      .prepare('SELECT id, email, name, phone, address, avatar_url, role, must_change_password FROM users WHERE id = ?')
      .get(result.lastInsertRowid)

    const tokens = issueTokens(user.id)
    res.status(201).json({ user, ...tokens })
  } catch (error) {
    next(error)
  }
})

// Login
router.post('/login', validate(loginSchema), (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email)

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const tokens = issueTokens(user.id)
    res.json({ user: sanitizeUser(user), ...tokens })
  } catch (error) {
    next(error)
  }
})

// Refresh access token usando refresh token
router.post('/refresh', validate(refreshSchema), (req, res) => {
  try {
    const { refreshToken } = req.body
    const { userId } = verifyRefreshToken(refreshToken)
    // Rotación: revoco el actual y emito par nuevo
    revokeRefreshToken(refreshToken)
    const tokens = issueTokens(userId)
    res.json(tokens)
  } catch (error) {
    // Solo errores auténticos de validación de token caen en 401; otros suben al handler central
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' })
    }
    logger.error({ err: error }, 'refresh endpoint error inesperado')
    return res.status(500).json({ error: 'Error al refrescar sesión' })
  }
})

// Logout: invalida refresh token(s)
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body || {}
  if (refreshToken && typeof refreshToken === 'string') {
    try {
      revokeRefreshToken(refreshToken)
    } catch (_e) {
      // noop
    }
  }
  res.json({ message: 'Sesión cerrada' })
})

// Current user
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user })
})

// Actualizar perfil propio. Solo campos permitidos por el schema.
router.put('/me', authenticateToken, validate(profileUpdateSchema), (req, res, next) => {
  try {
    const current = db
      .prepare('SELECT id, email, name, phone, address, avatar_url, role FROM users WHERE id = ?')
      .get(req.user.id)
    const merged = { ...current, ...req.body }

    db.prepare(
      `UPDATE users SET name = ?, phone = ?, address = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(
      merged.name ?? null,
      merged.phone ?? null,
      merged.address ?? null,
      merged.avatar_url ?? null,
      req.user.id
    )

    const user = db
      .prepare('SELECT id, email, name, phone, address, avatar_url, role FROM users WHERE id = ?')
      .get(req.user.id)
    res.json({ user })
  } catch (error) {
    next(error)
  }
})

// Solicitar recuperación de contraseña.
// Siempre responde 200 para no filtrar existencia del email.
router.post('/forgot-password', validate(forgotPasswordSchema), async (req, res, next) => {
  try {
    const { email } = req.body
    const user = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get(email)

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1h

      db.prepare(
        'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
      ).run(user.id, tokenHash, expiresAt)

      const base = process.env.FRONTEND_URL?.split(',')[0]?.trim() || 'http://localhost:5173'
      const resetUrl = `${base}/reset-password/${rawToken}`
      const mail = passwordResetEmail({ name: user.name, resetUrl })

      try {
        await sendMail({ to: user.email, ...mail })
      } catch (mailErr) {
        // No filtramos este error al cliente para no revelar estado.
        logger.error({ err: mailErr }, 'Fallo enviando email de reset')
      }
    }

    res.json({ message: 'Si el correo existe, recibirás instrucciones en unos minutos.' })
  } catch (error) {
    next(error)
  }
})

// Aplicar nuevo password usando token de reset.
router.post('/reset-password', validate(resetPasswordSchema), (req, res, next) => {
  try {
    const { token, password } = req.body
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const row = db
      .prepare(
        'SELECT id, user_id, expires_at, used_at FROM password_resets WHERE token_hash = ?'
      )
      .get(tokenHash)

    if (!row || row.used_at || new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Token inválido o expirado' })
    }

    const passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS)

    const tx = db.transaction(() => {
      db.prepare(
        'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(passwordHash, row.user_id)
      db.prepare('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?').run(row.id)
      // Invalida todas las sesiones activas del usuario
      db.prepare(
        'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL'
      ).run(row.user_id)
    })
    tx()

    res.json({ message: 'Contraseña actualizada. Inicia sesión con tus nuevas credenciales.' })
  } catch (error) {
    next(error)
  }
})

module.exports = router
// Export utilidades internas para tests
module.exports.revokeAllUserTokens = revokeAllUserTokens
