const { z } = require('zod')

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(100),
  icon: z.string().trim().max(20).optional().nullable(),
  display_order: z.number().int().min(0).optional()
})

const categoryUpdateSchema = categoryCreateSchema.partial()

module.exports = { categoryCreateSchema, categoryUpdateSchema }
