import { Router } from 'express'
import { sql } from '../database/db.js'
import { authenticate } from '../middlewares/auth.js'
import authRoutes from './auth.routes.js'
import meRoutes from './me.routes.js'
import sectorRoutes from './sector.routes.js'
import employeeRoutes from './employee.routes.js'
import {
  teamRoutes,
  regionRoutes,
  holidayRoutes,
  occasionRoutes,
  confirmationRoutes,
  dashboardRoutes
} from './structure.routes.js'

const router = Router()

// Públicas
router.get('/health', async (_req, res) => {
  await sql`select 1`
  res.json({ status: 'ok' })
})
router.use('/auth', authRoutes)

// Privadas (exigem token)
const privateRoutes = {
  '/me': meRoutes,
  '/sectors': sectorRoutes,
  '/teams': teamRoutes,
  '/regions': regionRoutes,
  '/employees': employeeRoutes,
  '/holidays': holidayRoutes,
  '/occasions': occasionRoutes,
  '/confirmations': confirmationRoutes,
  '/dashboard': dashboardRoutes
}
for (const [path, routes] of Object.entries(privateRoutes)) router.use(path, authenticate, routes)

export default router
