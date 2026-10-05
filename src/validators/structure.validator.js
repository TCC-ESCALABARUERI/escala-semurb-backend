import { z } from 'zod'
import { optionalId, isoDate } from './common.js'

export const nameBody = z.object({ name: z.string().trim().min(2).max(80) })
export const teamBody = nameBody.extend({ sectorId: optionalId })
export const sectorQuery = z.object({ sectorId: optionalId })

const holiday = z.object({ day: isoDate, name: z.string().trim().min(2).max(80) })
export const holidaysBody = z
  .union([holiday, z.array(holiday).min(1)])
  .transform(v => (Array.isArray(v) ? v : [v]))
export const yearQuery = z.object({ year: z.coerce.number().int().min(2000).max(2100).optional() })
