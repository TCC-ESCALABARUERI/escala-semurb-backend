import * as Employee from '../models/employee.model.js'
import * as Team from '../models/team.model.js'
import * as Sector from '../models/sector.model.js'
import * as Holiday from '../models/holiday.model.js'
import * as Occasion from '../models/occasion.model.js'
import { badRequest, notFound } from '../utils/AppError.js'
import { scopedSector, assertSector, loadManagedEmployee } from './access.js'
import { monthRange } from './schedule.service.js'
import { buildMonthSchedule } from './rules/scale.rules.js'

// O service só monta os DADOS do relatório; o desenho do PDF fica na View (src/views/reports).

async function monthContext(year, month, filters) {
  const { from, to } = monthRange(year, month)
  const [holidays, occasions] = await Promise.all([
    Holiday.findBetween(from, to),
    Occasion.findMany({ ...filters, from, to })
  ])
  return { holidays, occasions }
}

// Resumo do mês por funcionário (dias trabalhados/folga) usando a mesma regra da escala
function withMonthSummary(employees, { year, month, holidays, occasions }) {
  return employees.map(e => {
    const own = occasions.filter(o => o.registration === e.registration)
    const { summary } = buildMonthSchedule({
      scale: e.scale,
      shift: e.shift,
      year,
      month,
      holidays,
      occasions: own
    })
    return { ...e, monthSummary: summary }
  })
}

export async function sector(user, { sectorId, year, month }) {
  const id = scopedSector(user, sectorId)
  if (!id) throw badRequest('Informe o setor (sectorId)')
  const sectorData = await Sector.findById(id)
  if (!sectorData) throw notFound('Setor não encontrado')

  const [teams, employees, ctx] = await Promise.all([
    Team.findAll(id),
    Employee.findMany({ sectorId: id }),
    monthContext(year, month, { sectorId: id })
  ])
  return {
    sector: sectorData,
    year,
    month,
    teams,
    employees: withMonthSummary(employees, { year, month, ...ctx }),
    ...ctx
  }
}

export async function team(user, teamId, { year, month }) {
  const teamData = await Team.findById(teamId)
  if (!teamData) throw notFound('Equipe não encontrada')
  assertSector(user, teamData.sectorId)

  const [sectorData, employees, ctx] = await Promise.all([
    Sector.findById(teamData.sectorId),
    Employee.findMany({ teamId }),
    monthContext(year, month, { sectorId: teamData.sectorId })
  ])
  const registrations = new Set(employees.map(e => e.registration))
  const occasions = ctx.occasions.filter(o => registrations.has(o.registration))
  return {
    team: teamData,
    sector: sectorData,
    year,
    month,
    employees: withMonthSummary(employees, { year, month, holidays: ctx.holidays, occasions }),
    holidays: ctx.holidays,
    occasions
  }
}

export async function employee(user, registration, { year, month }) {
  await loadManagedEmployee(user, registration)
  const data = await Employee.findDetailed(registration)
  const ctx = await monthContext(year, month, { registration })
  return {
    employee: data,
    year,
    month,
    schedule: buildMonthSchedule({ scale: data.scale, shift: data.shift, year, month, ...ctx })
  }
}
