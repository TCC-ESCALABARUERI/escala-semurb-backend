import * as Notification from '../models/notification.model.js'

// Ponto único para criar notificações (antes duplicado em 2 arquivos)
export const notify = (registration, type, message, responsible = null, db) =>
  Notification.create({ registration, type, message, responsible }, db)
