import { Router } from 'express'
import * as SectorController from '../controllers/sector.controller.js'
import { authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { idParam } from '../validators/common.js'
import { sectorBody } from '../validators/sector.validator.js'
import { ROLES } from '../utils/token.js'

const router = Router()

router.get('/', authorize(ROLES.MASTER, ROLES.ADMIN), SectorController.index)
router.get(
  '/:id',
  authorize(ROLES.MASTER, ROLES.ADMIN),
  validate({ params: idParam }),
  SectorController.show
)

router.use(authorize(ROLES.MASTER))
router.post('/', validate({ body: sectorBody }), SectorController.store)
router.patch('/:id', validate({ params: idParam, body: sectorBody }), SectorController.update)
router.delete('/:id', validate({ params: idParam }), SectorController.destroy)

export default router
