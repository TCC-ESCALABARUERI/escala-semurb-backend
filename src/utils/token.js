import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export const ROLES = Object.freeze({ MASTER: 'master', ADMIN: 'admin', EMPLOYEE: 'employee' })

// Token de acesso: quem é (sub), o que pode (role) e de qual setor (sectorId)
export function signAccessToken({ registration, role, sectorId = null }) {
  return jwt.sign({ sub: String(registration), role, sectorId, purpose: 'access' }, env.jwtSecret, {
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
