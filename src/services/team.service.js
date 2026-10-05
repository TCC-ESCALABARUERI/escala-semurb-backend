import * as Team from '../models/team.model.js'
import * as Sector from '../models/sector.model.js'
import { notFound, conflict, badRequest } from '../utils/AppError.js'
import { scopedSector, assertSector } from './access.js'

export const list = (user, { sectorId } = {}) => Team.findAll(scopedSector(user, sectorId))

async function loadManaged(user, id) {
  const team = await Team.findById(id)
  if (!team) throw notFound('Equipe não encontrada')
  assertSector(user, team.sectorId)
  return team
}

export const getById = loadManaged

export async function create(user, { name, sectorId }) {
  const targetSector = scopedSector(user, sectorId)
  if (!targetSector) throw badRequest('Informe o setor da equipe')
  if (!(await Sector.findById(targetSector))) throw notFound('Setor não encontrado')
  return Team.create({ name, sectorId: targetSector })
}

export async function rename(user, id, name) {
  await loadManaged(user, id)
  return Team.update(id, name)
}

// Regra: não apagar equipe com funcionários
export async function remove(user, id) {
  const team = await loadManaged(user, id)
  if (team.employeeCount > 0) {
    throw conflict(
      `Equipe possui ${team.employeeCount} funcionário(s). Transfira-os antes de excluir.`
    )
  }
  await Team.remove(id)
}
