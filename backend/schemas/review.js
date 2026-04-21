const { z } = require('zod')

const reviewCreateSchema = z.object({
  product_id: z.number().int().positive(),
  order_id: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().nullable()
})

const reviewModerateSchema = z.object({
  approved: z.boolean()
})

module.exports = { reviewCreateSchema, reviewModerateSchema }
