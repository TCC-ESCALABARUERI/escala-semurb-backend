import * as Holiday from '../models/holiday.model.js'
import { notFound } from '../utils/AppError.js'

export const list = year => Holiday.findAll(year)

export const createMany = holidays => Holiday.createMany(holidays)

export async function remove(id) {
  if (!(await Holiday.remove(id))) throw notFound('Feriado não encontrado')
}
