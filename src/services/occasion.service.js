import { sql } from '../database/db.js'
import * as Occasion from '../models/occasion.model.js'
import { notFound, badRequest } from '../utils/AppError.js'
import { loadManagedEmployee, scopedSector, assertSector, responsibleOf } from './access.js'
import { notify } from './notification.service.js'

export function create(user, registration, data) {
  if (data.type === 'Alteração de turno' && !data.startTime) {
    throw badRequest('Alteração de turno exige horário de início e fim')
  }
  return sql.begin(async tx => {
    await loadManagedEmployee(user, registration, tx)
    const occasion = await Occasion.create(
      {
        registration,
        day: data.day,
        type: data.type,
        description: data.description ?? null,
        startTime: data.startTime ?? null,
        endTime: data.endTime ?? null,
        responsible: responsibleOf(user)
      },
      tx
    )
    await notify(
      registration,
      'Dia Específico',
      `${data.type} registrado para ${data.day}.`,
      responsibleOf(user),
      tx
    )
    return occasion
  })
}

export const listForSector = (user, filters) =>
  Occasion.findMany({ ...filters, sectorId: scopedSector(user, filters.sectorId) })

export async function listForEmployee(user, registration, filters) {
  await loadManagedEmployee(user, registration)
  return Occasion.findMany({ ...filters, registration })
}

export const listMine = (registration, filters) => Occasion.findMany({ ...filters, registration })

export async function remove(user, id) {
  const occasion = await Occasion.findById(id)
  if (!occasion) throw notFound('Dia específico não encontrado')
  assertSector(user, occasion.sectorId)
  await Occasion.remove(id)
}
