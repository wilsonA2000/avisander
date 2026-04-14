const { z } = require('zod')

// Item del pedido. Soporta dos modos:
//   - sale_type 'fixed': cliente pide N piezas a precio fijo (price)
//   - sale_type 'by_weight': cliente pide gramos exactos; el precio se calcula
//     en backend a partir de price_per_kg del producto en BD (nunca confiamos
//     en el price del cliente para evitar manipulación).
const orderItemSchema = z
  .object({
    product_id: z.number().int().positive().optional().nullable(),
    name: z.string().trim().min(1).max(200),
    sale_type: z.enum(['fixed', 'by_weight']).default('fixed'),
    price: z.number().positive().finite().optional(), // ignorado para by_weight
    quantity: z.number().positive().finite().optional(),
    weight_grams: z.number().positive().finite().min(50).max(20000).optional(),
    notes: z.string().trim().max(500).optional().nullable()
  })
  .superRefine((data, ctx) => {
    if (data.sale_type === 'by_weight') {
      if (!data.weight_grams) {
        ctx.addIssue({
          code: 'custom',
          path: ['weight_grams'],
          message: 'weight_grams requerido (entre 50 y 20000)'
        })
      }
    } else {
      if (!data.quantity || data.quantity <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['quantity'],
          message: 'quantity > 0 requerido'
        })
      }
      if (!data.price || data.price <= 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['price'],
          message: 'price > 0 requerido'
        })
      }
    }
  })

const orderCreateSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Al menos un producto'),
  customer_name: z.string().trim().max(120).optional().nullable(),
  customer_phone: z.string().trim().max(30).optional().nullable(),
  customer_address: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  delivery_method: z.enum(['delivery', 'pickup']).default('delivery'),
  delivery_lat: z.number().min(-90).max(90).optional().nullable(),
  delivery_lng: z.number().min(-180).max(180).optional().nullable(),
  delivery_city: z.string().trim().max(80).optional().nullable(),
  payment_method: z.enum(['whatsapp', 'bold', 'cash', 'pickup']).optional().default('whatsapp')
})

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'processing', 'completed', 'cancelled'])
})

module.exports = { orderCreateSchema, orderStatusSchema }
