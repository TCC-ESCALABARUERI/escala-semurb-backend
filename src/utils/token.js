import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const ROLES = Object.freeze({ MASTER: 'master', ADMIN: 'admin', EMPLOYEE: 'employee' })

// Token de acesso: quem é (sub), o que pode (role) e de qual setor (sectorId)
// mustChangePassword: enquanto true, o token só acessa GET /me e PATCH /me/password
export function signAccessToken({
  registration,
  role,
  sectorId = null,
  mustChangePassword = false
}) {
  const payload = {
    sub: String(registration),
    role,
    sectorId,
    mcp: mustChangePassword,
    purpose: 'access'
  }
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  })
}

// Token curto emitido após validar o código de e-mail; só serve para redefinir senha
export function signResetToken(registration) {
  return jwt.sign({ sub: String(registration), purpose: 'reset' }, env.jwtSecret, {
    expiresIn: '10m'
  })
}

export function verifyToken(token, purpose) {
  const payload = jwt.verify(token, env.jwtSecret)
  if (payload.purpose !== purpose) throw new Error('Finalidade do token inválida')
  return payload
}
