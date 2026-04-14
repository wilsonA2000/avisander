const express = require('express')
const { z } = require('zod')
const { validate } = require('../middleware/validate')
const { quoteDelivery, STORE, MAX_DISTANCE_KM, CITY_FLAT_RATE } = require('../lib/delivery')

const router = express.Router()

const quoteSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  city: z.string().trim().max(80).optional().nullable(),
  subtotal: z.number().nonnegative().optional()
})

// Info de la tienda (para que el frontend sepa origen y reglas)
router.get('/info', (_req, res) => {
  res.json({
    store: STORE,
    max_distance_km: MAX_DISTANCE_KM,
    cities_flat_rate: CITY_FLAT_RATE,
    free_delivery_threshold: 200000
  })
})

// POST /api/delivery/quote
router.post('/quote', validate(quoteSchema), (req, res) => {
  const result = quoteDelivery(req.body)
  res.json(result)
})

module.exports = router
