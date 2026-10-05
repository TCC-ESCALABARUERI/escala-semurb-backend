import * as Employee from '../models/employee.model.js'
import * as Holiday from '../models/holiday.model.js'
import * as Occasion from '../models/occasion.model.js'
import { notFound } from '../utils/AppError.js'
import { loadManagedEmployee } from './access.js'
import { buildMonthSchedule, monthDays } from './rules/scale.rules.js'

export function monthRange(year, month) {
  const days = monthDays(year, month)
  return { from: days[0], to: days.at(-1) }
}

/** Calendário do mês de um funcionário já carregado (com scale e shift). */
export async function forEmployee(employee, { year, month }) {
  const { from, to } = monthRange(year, month)
  const [holidays, occasions] = await Promise.all([
    Holiday.findBetween(from, to),
    Occasion.findMany({ registration: employee.registration, from, to })
  ])
  return buildMonthSchedule({
    scale: employee.scale,
    shift: employee.shift,
    year,
    month,
    holidays,
    occasions
  })
}

export async function mine(registration, period) {
  const employee = await Employee.findDetailed(registration)
  if (!employee) throw notFound('Funcionário não encontrado')
  return forEmployee(employee, period)
}

export async function ofEmployee(user, registration, period) {
  await loadManagedEmployee(user, registration)
  return forEmployee(await Employee.findDetailed(registration), period)
}
