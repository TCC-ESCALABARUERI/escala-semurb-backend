import { Router } from 'express'
import { sql } from '../database/db.js'
import { authenticate } from '../middlewares/auth.js'
import authRoutes from './auth.routes.js'
import meRoutes from './me.routes.js'
import sectorRoutes from './sector.routes.js'

const router = Router()

// Públicas
router.get('/health', async (_req, res) => {
  await sql`select 1`
  res.json({ status: 'ok' })
})
router.use('/auth', authRoutes)

// Privadas (exigem token)
router.use('/me', authenticate, meRoutes)
router.use('/sectors', authenticate, sectorRoutes)

export default router
