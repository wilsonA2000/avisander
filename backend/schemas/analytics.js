const { z } = require('zod')

const trackSchema = z.object({
  session_id: z.string().trim().min(1).max(120),
  path: z.string().trim().min(1).max(500),
  referrer: z.string().trim().max(500).optional().nullable()
})

module.exports = { trackSchema }
