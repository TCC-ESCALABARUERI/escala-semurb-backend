import * as MeService from '../services/me.service.js'
import * as AuthService from '../services/auth.service.js'

export async function show(req, res) {
  res.json(await MeService.getProfile(req.user))
}

export async function update(req, res) {
  res.json(await MeService.updateContact(req.user.registration, req.valid.body))
}

export async function changePassword(req, res) {
  await AuthService.changePassword(req.user.registration, req.valid.body)
  res.json({ message: 'Senha alterada com sucesso' })
}

export async function confirmScale(req, res) {
  res.json(await MeService.confirmScale(req.user.registration))
}

export async function notifications(req, res) {
  res.json(
    await MeService.listNotifications(req.user.registration, { onlyUnread: req.valid.query.unread })
  )
}

export async function readNotification(req, res) {
  await MeService.readNotification(req.user.registration, req.valid.params.id)
  res.status(204).end()
}

export async function readAllNotifications(req, res) {
  res.json({ updated: await MeService.readAllNotifications(req.user.registration) })
}

export async function uploadPhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Envie a imagem no campo "file"' })
  await MeService.savePhoto(req.user.registration, req.file)
  res.status(204).end()
}

export async function photo(req, res) {
  const { image, mimeType, updatedAt } = await MeService.getPhoto(req.user.registration)
  res
    .set({ 'Content-Type': mimeType, 'Last-Modified': new Date(updatedAt).toUTCString() })
    .send(image)
}

export async function removePhoto(req, res) {
  await MeService.removePhoto(req.user.registration)
  res.status(204).end()
}
