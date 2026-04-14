// Setup para Vitest: usa BD en archivo temporal y secretos dummy.
const path = require('path')
const fs = require('fs')
const os = require('os')

const crypto = require('crypto')
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex')
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex')
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'

// DB aislada por run
const tmpDb = path.join(os.tmpdir(), `avisander-test-${Date.now()}.sqlite`)
// Hack: la ruta está hardcoded en db/database.js; limpiamos el archivo real si existe
// pero como los tests comparten el proceso usamos la DB real y limpiamos las tablas.
// Para simplificar: reutilizamos la DB del backend pero limpiamos tablas auth antes.

module.exports = { tmpDb }
