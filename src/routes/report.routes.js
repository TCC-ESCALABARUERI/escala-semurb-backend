import { Router } from 'express'
import * as ReportController from '../controllers/report.controller.js'
import { authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam, registrationParam, monthQuery } from '../validators/common.js'
import { ROLES } from '../utils/token.js'

// /reports — PDFs mensais (?year=2026&month=10)
const router = Router()
router.use(authorize(ROLES.MASTER, ROLES.ADMIN))

router.get('/sector', validate({ query: monthQuery }), ReportController.sector)
router.get('/teams/:id', validate({ params: idParam, query: monthQuery }), ReportController.team)
router.get(
  '/employees/:registration',
  validate({ params: registrationParam, query: monthQuery }),
  ReportController.employee
)

export default router
