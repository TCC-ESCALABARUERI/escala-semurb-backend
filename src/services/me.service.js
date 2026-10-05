import * as Employee from '../models/employee.model.js'
import * as Confirmation from '../models/confirmation.model.js'
import * as Notification from '../models/notification.model.js'
import * as Profile from '../models/profile.model.js'
import { notFound, badRequest } from '../utils/AppError.js'

export async function getProfile(user) {
  if (user.role === 'master') return { role: 'master' }
  const employee = await Employee.findDetailed(user.registration)
  if (!employee) throw notFound('Funcionário não encontrado')
  return { role: user.role, ...employee }
}

export async function updateContact(registration, data) {
  const updated = await Employee.update(registration, data)
  if (!updated) throw notFound('Funcionário não encontrado')
  return updated
}

export async function confirmScale(registration) {
  const confirmed = await Confirmation.confirmCurrent(registration)
  if (confirmed) return confirmed

  const current = await Confirmation.findCurrent(registration)
  if (!current) throw notFound('Você não possui escala vinculada')
  throw badRequest('A escala atual já foi confirmada')
}

export const listNotifications = (registration, filters) =>
  Notification.findByEmployee(registration, filters)

export async function readNotification(registration, id) {
  if (!(await Notification.markAsRead(id, registration)))
    throw notFound('Notificação não encontrada')
}

export const readAllNotifications = registration => Notification.markAllAsRead(registration)

export const savePhoto = (registration, file) =>
  Profile.upsert(registration, file.buffer, file.mimetype)

export async function getPhoto(registration) {
  const photo = await Profile.findByRegistration(registration)
  if (!photo) throw notFound('Foto de perfil não encontrada')
  return photo
}

export async function removePhoto(registration) {
  if (!(await Profile.remove(registration))) throw notFound('Foto de perfil não encontrada')
}
