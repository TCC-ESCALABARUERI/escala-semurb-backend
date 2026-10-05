import { z } from 'zod'
import { email, phone, password, withConfirmation } from './common.js'

export const updateMeSchema = z
  .object({ email: email.optional(), phone: phone.optional() })
  .refine(d => Object.keys(d).length > 0, 'Informe ao menos um campo para atualizar')

export const changePasswordSchema = withConfirmation(
  z.object({
    currentPassword: z.string().min(1),
    newPassword: password,
    confirmPassword: z.string()
  }),
  'newPassword',
  'confirmPassword'
)

export const notificationsQuery = z.object({
  unread: z
    .enum(['true', 'false'])
    .optional()
    .transform(v => v === 'true')
})
