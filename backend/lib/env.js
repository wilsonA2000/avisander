const REQUIRED = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'FRONTEND_URL']

const MIN_SECRET_LENGTH = 32

function validateEnv() {
  const missing = REQUIRED.filter((k) => !process.env[k] || process.env[k].trim() === '')
  if (missing.length > 0) {
    console.error(
      `\n[avisander] Configuración inválida: faltan variables obligatorias en .env: ${missing.join(', ')}`
    )
    console.error('[avisander] Copia backend/.env.example a backend/.env y completa los valores.\n')
    process.exit(1)
  }

  for (const k of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (process.env[k].length < MIN_SECRET_LENGTH) {
      console.error(
        `\n[avisander] ${k} es demasiado corto (< ${MIN_SECRET_LENGTH} chars). Genera uno con:`
      )
      console.error(`  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\n`)
      process.exit(1)
    }
  }

  if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    console.error('\n[avisander] JWT_SECRET y JWT_REFRESH_SECRET deben ser distintos.\n')
    process.exit(1)
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development'
  }
}

module.exports = { validateEnv }
