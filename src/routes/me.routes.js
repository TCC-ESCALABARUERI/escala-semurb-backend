import { Router } from 'express'
import * as MeController from '../controllers/me.controller.js'
import { authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { uploadImage } from '../middlewares/upload.js'
import { idParam } from '../validators/common.js'
import {
  updateMeSchema,
  changePasswordSchema,
  notificationsQuery
} from '../validators/me.validator.js'
import { periodQuery } from '../validators/employee.validator.js'
import { ROLES } from '../utils/token.js'

const router = Router()

// GET /me vale para todos; o resto só para quem existe na tabela employee
router.get('/', MeController.show)
router.use(authorize(ROLES.ADMIN, ROLES.EMPLOYEE))

router.patch('/', validate({ body: updateMeSchema }), MeController.update)
router.patch('/password', validate({ body: changePasswordSchema }), MeController.changePassword)
router.post('/scale/confirm', MeController.confirmScale)

router.get('/notifications', validate({ query: notificationsQuery }), MeController.notifications)
router.patch('/notifications/read-all', MeController.readAllNotifications)
router.patch(
  '/notifications/:id/read',
  validate({ params: idParam }),
  MeController.readNotification
)

router.get('/occasions', validate({ query: periodQuery }), MeController.occasions)

router.get('/photo', MeController.photo)
router.put('/photo', uploadImage, MeController.uploadPhoto)
router.delete('/photo', MeController.removePhoto)

export default router
