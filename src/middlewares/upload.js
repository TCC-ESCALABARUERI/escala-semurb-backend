import multer from 'multer'
import { badRequest } from '../utils/AppError.js'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

// Arquivo fica em memória (vai direto para o banco); limite de 2 MB
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(badRequest('Envie uma imagem JPEG, PNG ou WEBP'))
}).single('file')
