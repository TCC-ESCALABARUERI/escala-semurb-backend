import * as Employee from '../models/employee.model.js'
import * as Holiday from '../models/holiday.model.js'
import * as Occasion from '../models/occasion.model.js'
import { scopedSector } from './access.js'
import { resolveDuty } from './rules/scale.rules.js'

/**
 * Quem trabalha numa data (escala + feriado + dias específicos).
 * Responde as duas listas para o front montar a visão do dia.
 */
export async function onDuty(user, { date, sectorId, teamId }) {
  const sector = scopedSector(user, sectorId)
  const [employees, holiday, occasions] = await Promise.all([
    Employee.findMany({ sectorId: sector, teamId }),
    Holiday.findByDay(date),
    Occasion.findMany({ sectorId: sector, from: date, to: date })
  ])
  const occasionByEmployee = new Map(occasions.map(o => [o.registration, o]))

  const working = []
  const off = []
  for (const e of employees) {
    const occasion = occasionByEmployee.get(e.registration) ?? null
    const duty = resolveDuty({ scale: e.scale, date, holiday, occasion })
    const item = {
      registration: e.registration,
      name: e.name,
      team: e.team,
      shift: occasion?.startTime
        ? { shiftStart: occasion.startTime, shiftEnd: occasion.endTime }
        : e.shift,
      reason: duty.reason,
      occasion: occasion && {
        id: occasion.id,
        type: occasion.type,
        description: occasion.description
      }
    }
    ;(duty.working ? working : off).push(item)
  }
  return { date, holiday, total: employees.length, working, off }
}
