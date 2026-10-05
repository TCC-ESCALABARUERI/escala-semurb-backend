import { verifyToken } from '../utils/token.js'
import { unauthorized, forbidden, AppError } from '../utils/AppError.js'

// Rotas liberadas enquanto a senha inicial não for trocada
const ALLOWED_BEFORE_PASSWORD_CHANGE = ['GET /api/me', 'PATCH /api/me/password']

// Autenticação: valida o token e expõe req.user = { registration, role, sectorId }
export function authenticate(req, _res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) throw unauthorized('Token não informado')

  let payload
  try {
    payload = verifyToken(token, 'access')
  } catch {
    throw unauthorized('Token inválido ou expirado')
  }

  req.user = {
    registration: payload.role === 'master' ? null : Number(payload.sub),
    role: payload.role,
    sectorId: payload.sectorId
  }

  const route = `${req.method} ${(req.baseUrl + req.path).replace(/\/$/, '')}`
  if (payload.mcp && !ALLOWED_BEFORE_PASSWORD_CHANGE.includes(route)) {
    throw new AppError(403, 'Troque a senha inicial antes de continuar', {
      code: 'PASSWORD_CHANGE_REQUIRED'
    })
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
