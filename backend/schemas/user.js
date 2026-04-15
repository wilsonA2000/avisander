const { z } = require('zod')

// Campos que el usuario autenticado puede editar sobre su propio perfil.
// Email y role NO son editables aquí (email requiere verificación, role es admin-only).
const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional().nullable(),
  phone: z.string().trim().max(30).optional().nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  avatar_url: z.string().trim().max(500).optional().nullable()
})

module.exports = { profileUpdateSchema }
