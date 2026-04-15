const { z } = require('zod')

const baseProductShape = {
  name: z.string().trim().min(1, 'Nombre requerido').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.number().nonnegative().finite(),
  original_price: z.number().positive().finite().optional().nullable(),
  unit: z.string().trim().max(30).optional(),
  sale_type: z.enum(['fixed', 'by_weight']).default('fixed'),
  price_per_kg: z.number().positive().finite().optional().nullable(),
  brand: z.string().trim().max(100).optional().nullable(),
  reference: z.string().trim().max(100).optional().nullable(),
  packaging: z.string().trim().max(200).optional().nullable(),
  cold_chain: z.enum(['refrigerado', 'congelado', 'ambiente']).optional().nullable(),
  ingredients: z.string().trim().max(2000).optional().nullable(),
  gallery_urls: z.array(z.string().trim().max(500)).max(8).optional().nullable(),
  category_id: z.number().int().positive().optional().nullable(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  is_on_sale: z.boolean().optional(),
  image_url: z.string().trim().max(500).optional().nullable(),
  // Sprint 3
  subcategory: z.string().trim().max(100).optional().nullable(),
  external_code: z.string().trim().max(80).optional().nullable(),
  tags: z.array(z.string().trim().max(40)).max(20).optional().nullable(),
  video_url: z.string().trim().max(500).optional().nullable(),
  slug: z.string().trim().max(100).optional().nullable(),
  // Sprint 6 Fase A: inventario
  stock_min: z.number().nonnegative().finite().optional().nullable(),
  barcode: z.string().trim().max(50).optional().nullable(),
  // Sprint 7F: bondades y usos culinarios
  benefits: z.string().trim().max(2000).optional().nullable(),
  culinary_uses: z.array(z.string().trim().max(30)).max(15).optional().nullable()
  // stock NO es editable desde products: solo vía compras/ajustes (auditoría).
  // cost_price tampoco: se calcula por promedio ponderado en /compras.
}

// Validador estricto (create): exige consistencia entre sale_type y precios
const validateSaleTypeStrict = (data, ctx) => {
  if (data.sale_type === 'by_weight') {
    if (!data.price_per_kg || data.price_per_kg <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price_per_kg'],
        message: 'Productos por peso requieren price_per_kg > 0'
      })
    }
  } else {
    if (data.price === undefined || data.price === null || data.price <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'Productos por pieza requieren price > 0'
      })
    }
  }
}

// Validador laxo (update): solo verifica si vienen los campos relevantes
const validateSaleTypePartial = (data, ctx) => {
  if (data.sale_type === 'by_weight' && data.price_per_kg !== undefined) {
    if (data.price_per_kg === null || data.price_per_kg <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price_per_kg'],
        message: 'price_per_kg debe ser > 0'
      })
    }
  }
  if (data.sale_type === 'fixed' && data.price !== undefined) {
    if (data.price === null || data.price <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'price debe ser > 0'
      })
    }
  }
}

const productCreateSchema = z.object(baseProductShape).superRefine(validateSaleTypeStrict)
const productUpdateSchema = z
  .object(
    Object.fromEntries(
      Object.entries(baseProductShape).map(([k, v]) => {
        // Quitar defaults y hacer optional para update
        const stripped = v._def?.typeName === 'ZodDefault' ? v.removeDefault() : v
        return [k, stripped.optional()]
      })
    )
  )
  .superRefine(validateSaleTypePartial)

module.exports = { productCreateSchema, productUpdateSchema }
