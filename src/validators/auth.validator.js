import { z } from 'zod'
import { email, password, withConfirmation } from './common.js'

export const loginSchema = z.object({
  registration: z.union([z.string(), z.number()]).transform(String),
  password: z.string().min(1, 'Informe a senha')
})

export const forgotSchema = z.object({ email })

export const verifySchema = z.object({
  email,
  code: z.string().regex(/^\d{6}$/, 'Código deve ter 6 dígitos')
})

export const resetSchema = withConfirmation(
  z.object({ resetToken: z.string().min(1), password, confirmPassword: z.string() }),
  'password',
  'confirmPassword'
)
