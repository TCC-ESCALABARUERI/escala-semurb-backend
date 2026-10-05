import { ZodError } from 'zod'
import multer from 'multer'
import { AppError } from '../utils/AppError.js'
import { env } from '../config/env.js'

// Códigos de erro do PostgreSQL traduzidos para HTTP
const PG_ERRORS = {
  23505: [409, 'Registro duplicado'],
  23503: [409, 'Registro relacionado não existe ou está em uso'],
  23514: [400, 'Valor fora das regras permitidas'],
  '22P02': [400, 'Formato de dado inválido']
}

export function notFoundHandler(req, res) {
  res.status(404).json({ message: `Rota não encontrada: ${req.method} ${req.originalUrl}` })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message, details: err.details })
  }
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Dados inválidos',
      details: err.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
    })
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: `Upload inválido: ${err.message}` })
  }
  if (err?.code && PG_ERRORS[err.code]) {
    const [status, message] = PG_ERRORS[err.code]
    return res.status(status).json({ message, details: env.isProduction ? undefined : err.detail })
  }
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'JSON malformado' })
  }

  console.error(err)
  res.status(500).json({ message: 'Erro interno do servidor' })
}
