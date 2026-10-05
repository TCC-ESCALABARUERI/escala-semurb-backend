import { sql } from '../database/db.js'
import * as Sector from '../models/sector.model.js'
import * as Team from '../models/team.model.js'
import { notFound, conflict } from '../utils/AppError.js'

export const list = () => Sector.findAll()

export async function getById(id) {
  const sector = await Sector.findById(id)
  if (!sector) throw notFound('Setor não encontrado')
  return sector
}

// Regra: todo setor nasce com a equipe administrativa "<Setor> (ADM)".
// Transação: ou cria os dois, ou nenhum.
export function create(name) {
  return sql.begin(async tx => {
    const sector = await Sector.create(name, tx)
    const team = await Team.create({ name: `${name} (ADM)`, sectorId: sector.id }, tx)
    return { ...sector, defaultTeam: team }
  })
}

export async function rename(id, name) {
  const sector = await Sector.update(id, name)
  if (!sector) throw notFound('Setor não encontrado')
  return sector
}

// Regra: não apagar setor com funcionários (evita deixar pessoas "órfãs")
export async function remove(id) {
  await getById(id)
  const total = await Sector.countEmployees(id)
  if (total > 0)
    throw conflict(`Setor possui ${total} funcionário(s). Transfira-os antes de excluir.`)
  await Sector.remove(id)
}
