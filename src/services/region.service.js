import * as Region from '../models/region.model.js'
import { notFound, conflict } from '../utils/AppError.js'

export const list = () => Region.findAll()

export const create = name => Region.create(name)

export async function rename(id, name) {
  const region = await Region.update(id, name)
  if (!region) throw notFound('Região não encontrada')
  return region
}

export async function remove(id) {
  const regions = await Region.findAll()
  const region = regions.find(r => r.id === id)
  if (!region) throw notFound('Região não encontrada')
  if (region.employeeCount > 0) {
    throw conflict(`Região possui ${region.employeeCount} funcionário(s) vinculados.`)
  }
  await Region.remove(id)
}
