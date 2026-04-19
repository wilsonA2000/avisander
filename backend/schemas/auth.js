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
  phone: z.string().trim().max(30).optional()
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
  passwordPolicy
}
