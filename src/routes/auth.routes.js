import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import * as AuthController from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.js'
import {
  loginSchema,
  forgotSchema,
  verifySchema,
  resetSchema
} from '../validators/auth.validator.js'

const router = Router()

// Limita tentativas por IP (proteção contra força bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false
})
router.use(authLimiter)

router.post('/login', validate({ body: loginSchema }), AuthController.login)
router.post('/password/forgot', validate({ body: forgotSchema }), AuthController.forgotPassword)
router.post('/password/verify', validate({ body: verifySchema }), AuthController.verifyCode)
router.post('/password/reset', validate({ body: resetSchema }), AuthController.resetPassword)

export default router
