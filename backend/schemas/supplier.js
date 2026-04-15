const { z } = require('zod')

const supplierCreateSchema = z.object({
  name: z.string().trim().min(1).max(200),
  nit: z.string().trim().max(30).optional().nullable(),
  contact_name: z.string().trim().max(150).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(200).optional().nullable().or(z.literal('')),
  address: z.string().trim().max(300).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  is_active: z.boolean().optional()
})

const supplierUpdateSchema = supplierCreateSchema.partial()

module.exports = { supplierCreateSchema, supplierUpdateSchema }
