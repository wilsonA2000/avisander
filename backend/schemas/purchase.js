const { z } = require('zod')

const purchaseItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().positive().finite(),
  unit_cost: z.number().nonnegative().finite()
})

const purchaseCreateSchema = z.object({
  supplier_id: z.number().int().positive().optional().nullable(),
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, 'Agrega al menos un item')
})

const purchaseUpdateSchema = z.object({
  supplier_id: z.number().int().positive().optional().nullable(),
  reference: z.string().trim().max(100).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  items: z.array(purchaseItemSchema).min(1).optional()
})

module.exports = { purchaseCreateSchema, purchaseUpdateSchema }
