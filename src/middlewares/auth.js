import { verifyToken } from '../utils/token.js'
import { unauthorized, forbidden } from '../utils/AppError.js'

// Autenticação: valida o token e expõe req.user = { registration, role, sectorId }
export function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) throw unauthorized('Token não informado')

  try {
    const payload = verifyToken(token, 'access')
    req.user = {
      registration: payload.role === 'master' ? null : Number(payload.sub),
      role: payload.role,
      sectorId: payload.sectorId
    }
  } catch {
    throw unauthorized('Token inválido ou expirado')
  }
  next()
}

// Autorização: libera a rota só para os papéis informados
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user?.role)) throw forbidden('Seu perfil não tem acesso a este recurso')
    next()
  }
