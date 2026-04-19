const { z } = require('zod')

// Ajuste manual: la cantidad puede ser positiva (sumar) o negativa (restar).
const inventoryAdjustSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().finite().refine((n) => n !== 0, 'quantity distinto de cero'),
  type: z.enum(['adjustment', 'waste', 'return']).default('adjustment'),
  notes: z.string().trim().min(1, 'Razón requerida').max(500)
})

const inventoryAvailabilitySchema = z.object({
  is_available: z.coerce.boolean()
})

module.exports = { inventoryAdjustSchema, inventoryAvailabilitySchema }
