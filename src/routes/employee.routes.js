import { Router } from 'express'
import * as EmployeeController from '../controllers/employee.controller.js'
import * as ReportController from '../controllers/report.controller.js'
import { authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { registrationParam, monthQuery } from '../validators/common.js'
import * as v from '../validators/employee.validator.js'
import { ROLES } from '../utils/token.js'

const router = Router()
const byReg = { params: registrationParam }

router.use(authorize(ROLES.MASTER, ROLES.ADMIN))

// rotas fixas antes de /:registration
router.get('/on-duty', validate({ query: v.onDutyQuery }), EmployeeController.onDuty)

router.get('/', validate({ query: v.listQuery }), EmployeeController.index)
router.post('/', validate({ body: v.createSchema }), EmployeeController.store)
router.get('/:registration', validate(byReg), EmployeeController.show)
router.patch(
  '/:registration',
  validate({ ...byReg, body: v.updateSchema }),
  EmployeeController.update
)
router.delete(
  '/:registration',
  authorize(ROLES.MASTER),
  validate(byReg),
  EmployeeController.destroy
)
router.post('/:registration/password-reset', validate(byReg), EmployeeController.resetPassword)

router.put(
  '/:registration/scale',
  validate({ ...byReg, body: v.scaleSchema }),
  EmployeeController.setScale
)
router.put(
  '/:registration/shift',
  validate({ ...byReg, body: v.shiftSchema }),
  EmployeeController.setShift
)

router.get(
  '/:registration/schedule',
  validate({ ...byReg, query: monthQuery }),
  ReportController.employeeSchedule
)
router.get(
  '/:registration/occasions',
  validate({ ...byReg, query: v.periodQuery }),
  EmployeeController.occasions
)
router.post(
  '/:registration/occasions',
  validate({ ...byReg, body: v.occasionSchema }),
  EmployeeController.createOccasion
)

export default router
