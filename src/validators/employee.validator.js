import { z } from 'zod'
import { registration, email, phone, name, optionalId, isoDate, hhmm } from './common.js'
import { OCCASION_TYPES } from '../services/rules/scale.rules.js'

const nullableId = z.coerce.number().int().positive().nullable().optional()

export const listQuery = z.object({
  sectorId: optionalId,
  teamId: optionalId,
  regionId: optionalId,
  search: z.string().trim().min(1).optional()
})

export const createSchema = z.object({
  registration,
  name,
  email,
  phone,
  position: z.string().trim().max(80).optional(),
  sectorId: optionalId, // só o master informa; admin usa o próprio setor
  teamId: optionalId,
  regionId: optionalId,
  isAdmin: z.boolean().optional()
})

export const updateSchema = z
  .object({
    name: name.optional(),
    email: email.optional(),
    phone: phone.optional(),
    position: z.string().trim().max(80).nullable().optional(),
    sectorId: optionalId,
    teamId: nullableId,
    regionId: nullableId,
    isAdmin: z.boolean().optional()
  })
  .refine(d => Object.keys(d).length > 0, 'Informe ao menos um campo para atualizar')

export const scaleSchema = z.object({
  startDate: isoDate,
  scaleType: z.string().trim(),
  weeklyDaysOff: z.array(z.string()).optional()
})

export const shiftSchema = z.object({
  shiftStart: hhmm,
  shiftEnd: hhmm,
  shiftPause: hhmm.default('00:00')
})

export const occasionSchema = z
  .object({
    day: isoDate,
    type: z.enum(OCCASION_TYPES),
    description: z.string().trim().max(500).optional(),
    startTime: hhmm.optional(),
    endTime: hhmm.optional()
  })
  .refine(d => !d.startTime === !d.endTime, {
    message: 'Informe início e fim juntos',
    path: ['endTime']
  })

export const periodQuery = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  type: z.enum(OCCASION_TYPES).optional(),
  sectorId: optionalId
})

export const onDutyQuery = z.object({ date: isoDate, sectorId: optionalId, teamId: optionalId })

export const confirmationQuery = z.object({
  sectorId: optionalId,
  status: z.enum(['Pendente', 'Confirmado']).optional()
})
