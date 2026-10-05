import { sql } from '../database/db.js'
import * as Employee from '../models/employee.model.js'
import { scopedSector, responsibleOf } from './access.js'
import { notify } from './notification.service.js'

export function list(user, { sectorId, status }) {
  return Employee.findMany({
    sectorId: scopedSector(user, sectorId),
    withScale: true,
    confirmationStatus: status
  }).then(rows =>
    rows.map(e => ({
      registration: e.registration,
      name: e.name,
      team: e.team,
      scale: e.scale,
      confirmation: e.confirmation
    }))
  )
}

/**
 * Lembra quem não confirmou a escala atual.
 * (Bug do v1 corrigido: filtrava "sem confirmação", mas ela sempre nasce Pendente → dava sempre 0.)
 */
export async function remindPending(user, { sectorId }) {
  const pending = await Employee.findMany({
    sectorId: scopedSector(user, sectorId),
    withScale: true,
    confirmationStatus: 'Pendente'
  })
  await sql.begin(async tx => {
    for (const e of pending) {
      await notify(
        e.registration,
        'Lembrete',
        'Você ainda não confirmou o recebimento da sua escala.',
        responsibleOf(user),
        tx
      )
    }
    if (user.registration && pending.length > 0) {
      await notify(
        user.registration,
        'Pendências',
        `${pending.length} funcionário(s) ainda não confirmaram a escala. Lembrete enviado.`,
        null,
        tx
      )
    }
  })
  return {
    reminded: pending.length,
    employees: pending.map(e => ({ registration: e.registration, name: e.name }))
  }
}
