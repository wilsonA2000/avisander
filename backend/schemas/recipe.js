const { z } = require('zod')

const baseRecipeShape = {
  title: z.string().trim().min(1, 'Título requerido').max(200),
  slug: z.string().trim().max(200).optional().nullable(),
  summary: z.string().trim().max(500).optional().nullable(),
  cover_image_url: z.string().trim().max(500).optional().nullable(),
  video_url: z.string().trim().max(500).optional().nullable(),
  body_markdown: z.string().trim().max(20000).optional().nullable(),
  duration_min: z.number().int().positive().max(1440).optional().nullable(),
  difficulty: z.enum(['facil', 'media', 'dificil']).optional().nullable(),
  meal_type: z.enum(['desayuno', 'almuerzo', 'cena', 'rapido', 'gourmet', 'especial']).optional().nullable(),
  servings: z.number().int().positive().max(100).optional().nullable(),
  is_published: z.boolean().optional(),
  product_ids: z.array(z.number().int().positive()).max(30).optional().nullable()
}

const recipeCreateSchema = z.object(baseRecipeShape)
const recipeUpdateSchema = z.object(
  Object.fromEntries(
    Object.entries(baseRecipeShape).map(([k, v]) => [k, v.optional()])
  )
)

module.exports = { recipeCreateSchema, recipeUpdateSchema }
