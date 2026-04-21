const { z } = require('zod')

const isoDateTime = z
  .string()
  .trim()
  .refine((v) => v === '' || !Number.isNaN(Date.parse(v)), 'Fecha inválida')
  .transform((v) => (v === '' ? null : new Date(v).toISOString()))

const featuredOfferCreateSchema = z.object({
  product_id: z.number().int().positive(),
  position: z.number().int().min(0).max(999).optional(),
  special_price: z.number().positive().nullable().optional(),
  original_price_override: z.number().positive().nullable().optional(),
  starts_at: isoDateTime.nullable().optional(),
  ends_at: isoDateTime.nullable().optional(),
  is_active: z.union([z.boolean(), z.number().int().min(0).max(1)]).optional(),
  headline: z.string().trim().max(120).nullable().optional()
})

const featuredOfferUpdateSchema = featuredOfferCreateSchema.partial().extend({
  product_id: z.number().int().positive().optional()
})

const featuredOfferReorderSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.number().int().positive(),
        position: z.number().int().min(0).max(999)
      })
    )
    .min(1)
    .max(50)
})

module.exports = {
  featuredOfferCreateSchema,
  featuredOfferUpdateSchema,
  featuredOfferReorderSchema
}
