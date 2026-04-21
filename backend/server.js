require('dotenv').config()

const { validateEnv } = require('./lib/env')
validateEnv()

const logger = require('./lib/logger')
const db = require('./db/database')
const { createApp } = require('./app')
const stockReservation = require('./lib/stockReservation')
const reviewInviteCron = require('./lib/reviewInviteCron')

const PORT = Number(process.env.PORT) || 3000

db.initialize()

// Expira reservas de stock cada 60s (TTL por defecto 15 min).
stockReservation.startScheduler(60_000)

// Invitaciones a reseñar: barre cada hora en busca de órdenes entregadas
// hace N días que aún no han recibido el email. Idempotente.
reviewInviteCron.start(60 * 60 * 1000)

const app = createApp()
app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`)
  logger.info(`API disponible en http://localhost:${PORT}/api`)
})
