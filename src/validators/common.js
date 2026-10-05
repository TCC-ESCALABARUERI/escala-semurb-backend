import { z } from 'zod'

export const registration = z.coerce
  .number()
  .int()
  .min(10000, 'Matrícula deve ter 5 dígitos')
  .max(99999, 'Matrícula deve ter 5 dígitos')
export const idParam = z.object({ id: z.coerce.number().int().positive() })
export const password = z.string().min(8, 'A senha deve ter no mínimo 8 caracteres').max(72)
export const email = z.email('E-mail inválido').trim().toLowerCase()
export const phone = z
  .string()
  .trim()
  .regex(/^\+?\d{10,13}$/, 'Telefone deve conter DDD e apenas números')

export const withConfirmation = (schema, field, confirmField) =>
  schema.refine(d => d[field] === d[confirmField], {
    message: 'As senhas não coincidem',
    path: [confirmField]
  })

export const isoDate = z.iso.date({ message: 'Data deve estar no formato AAAA-MM-DD' })
export const hhmm = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horário deve estar no formato HH:MM')
export const optionalId = z.coerce.number().int().positive().optional()
export const registrationParam = z.object({ registration })
export const name = z.string().trim().min(2).max(120)
