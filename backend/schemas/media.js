const { z } = require('zod')

const mediaAssignSchema = z.object({
  product_id: z.coerce.number().int().positive(),
  field: z.enum(['image_url', 'video_url', 'gallery'])
})

module.exports = { mediaAssignSchema }
