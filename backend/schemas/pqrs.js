const { z } = require('zod')

const pqrsCreateSchema = z.object({
  type: z.enum(['peticion', 'queja', 'reclamo', 'sugerencia']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().min(10).max(2000)
})

const pqrsUpdateSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved']).optional(),
  admin_notes: z.string().trim().max(2000).optional().nullable()
})

module.exports = { pqrsCreateSchema, pqrsUpdateSchema }
