const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { db } = require('../db/database')

const ACCESS_TTL_SECONDS = 15 * 60 // 15 min
const REFRESH_TTL_DAYS = 30
const REFRESH_TTL_MS = REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000

function signAccessToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TTL_SECONDS })
}

function generateRefreshToken(userId) {
  // Firmamos con el refresh secret PARA ADEMÁS persistir hash en BD.
  // El token que entregamos al cliente es el JWT; guardamos sha256(jwt) en refresh_tokens.
  // `jti` aleatorio garantiza unicidad incluso cuando se emiten dos tokens en el mismo segundo.
  const jti = crypto.randomBytes(16).toString('hex')
  const token = jwt.sign(
    { userId, type: 'refresh', jti },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: `${REFRESH_TTL_DAYS}d` }
  )
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS).toISOString()
  db.prepare(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)'
  ).run(userId, tokenHash, expiresAt)
  return token
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  if (payload.type !== 'refresh') {
    const err = new Error('Token inválido')
    err.name = 'JsonWebTokenError'
    throw err
  }
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const row = db
    .prepare(
      'SELECT id, user_id, expires_at, revoked_at FROM refresh_tokens WHERE token_hash = ?'
    )
    .get(tokenHash)
  if (!row || row.revoked_at) {
    const err = new Error('Refresh token inválido')
    err.name = 'JsonWebTokenError'
    throw err
  }
  if (new Date(row.expires_at) < new Date()) {
    const err = new Error('Refresh token expirado')
    err.name = 'TokenExpiredError'
    throw err
  }
  return { userId: row.user_id, tokenId: row.id }
}

function revokeRefreshToken(token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  db.prepare(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL'
  ).run(tokenHash)
}

function revokeAllUserTokens(userId) {
  db.prepare(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL'
  ).run(userId)
}

module.exports = {
  signAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserTokens,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_DAYS
}
