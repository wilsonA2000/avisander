const { z } = require('zod')

const passwordPolicy = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

const email = z.string().trim().toLowerCase().email('Email inválido').max(254)

const registerSchema = z.object({
  email,
  password: passwordPolicy,
  name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(30).optional(),
  apply_wholesaler: z.boolean().optional(),
  business_name: z.string().trim().max(150).optional(),
  nit: z.string().trim().max(40).optional(),
  business_type: z.string().trim().max(60).optional()
})

const wholesalerRequestSchema = z.object({
  business_name: z.string().trim().min(2, 'Razón social requerida').max(150),
  nit: z.string().trim().min(3, 'NIT requerido').max(40),
  business_type: z.string().trim().min(2, 'Tipo de negocio requerido').max(60)
})

const wholesalerRejectSchema = z.object({
  reason: z.string().trim().min(3).max(500)
})

const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128)
})

const forgotPasswordSchema = z.object({ email })

const resetPasswordSchema = z.object({
  token: z.string().min(10).max(200),
  password: passwordPolicy
})

const refreshSchema = z.object({
  refreshToken: z.string().min(10).max(500)
})

const changePasswordSchema = z.object({
  current_password: z.string().min(1).max(128),
  new_password: passwordPolicy
})

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
  changePasswordSchema,
  passwordPolicy,
  wholesalerRequestSchema,
  wholesalerRejectSchema
}
