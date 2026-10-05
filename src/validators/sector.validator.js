import { z } from 'zod'

export const sectorBody = z.object({ name: z.string().trim().min(2).max(80) })
