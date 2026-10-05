export class AppError extends Error {
  constructor(status, message, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

export const badRequest = (message, details) => new AppError(400, message, details)
export const unauthorized = (message = 'Não autenticado') => new AppError(401, message)
export const forbidden = (message = 'Acesso negado') => new AppError(403, message)
export const notFound = (message = 'Recurso não encontrado') => new AppError(404, message)
export const conflict = message => new AppError(409, message)
