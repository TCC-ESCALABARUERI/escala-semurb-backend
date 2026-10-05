import * as AuthService from '../services/auth.service.js'

// Controller = traduz HTTP ↔ service. Sem SQL e sem regra de negócio.

export async function login(req, res) {
  res.json(await AuthService.login(req.valid.body))
}

export async function forgotPassword(req, res) {
  await AuthService.requestPasswordReset(req.valid.body.email)
  res.status(202).json({ message: 'Se o e-mail estiver cadastrado, você receberá um código.' })
}

export async function verifyCode(req, res) {
  res.json(await AuthService.verifyResetCode(req.valid.body))
}

export async function resetPassword(req, res) {
  await AuthService.resetPassword(req.valid.body)
  res.json({ message: 'Senha redefinida com sucesso' })
}
