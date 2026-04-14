require('dotenv').config()

const { validateEnv } = require('./lib/env')
validateEnv()

const logger = require('./lib/logger')
const db = require('./db/database')
const { createApp } = require('./app')

const PORT = Number(process.env.PORT) || 3000

db.initialize()

const app = createApp()
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`)
  logger.info(`API disponible en http://localhost:${PORT}/api`)
})
