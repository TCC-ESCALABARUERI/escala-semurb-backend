import { sql } from '../database/db.js'

export const findAll = (year, db = sql) => db`
  select id, day, name from holiday
  ${year ? db`where extract(year from day) = ${year}` : db``}
  order by day`

export async function findByDay(day, db = sql) {
  const [row] = await db`select id, day, name from holiday where day = ${day}`
  return row ?? null
}

// Feriado já cadastrado na mesma data é ignorado (permite reenviar a lista do ano)
export const createMany = (holidays, db = sql) => db`
  insert into holiday ${db(holidays, 'day', 'name')}
  on conflict (day) do nothing
  returning id, day, name`

export async function remove(id, db = sql) {
  const result = await db`delete from holiday where id = ${id}`
  return result.count > 0
}
