const { z } = require('zod')

const aiGenerateImageSchema = z.object({
  prompt: z.string().trim().min(5).max(2000),
  negative_prompt: z.string().trim().max(1000).optional().nullable(),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4', '2:3', '3:2']).optional().default('1:1'),
  num_outputs: z.coerce.number().int().min(1).max(4).optional().default(1),
  model: z.enum(['flux-schnell', 'flux-dev']).optional().default('flux-schnell')
})

const aiImageUrlSchema = z.object({
  image_url: z.string().trim().min(1).max(2000)
})

const aiAssistantSchema = z.object({
  type: z.enum(['description', 'caption', 'seo', 'recipe', 'custom']),
  product_id: z.coerce.number().int().positive().optional().nullable(),
  prompt: z.string().trim().max(3000).optional().nullable()
})

module.exports = { aiGenerateImageSchema, aiImageUrlSchema, aiAssistantSchema }
