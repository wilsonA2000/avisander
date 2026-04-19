const { z } = require('zod')

const loyaltyAdjustSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  points: z.coerce.number().int().refine((n) => n !== 0, 'points no puede ser cero'),
  reason: z.string().trim().min(3).max(300)
})

module.exports = { loyaltyAdjustSchema }
