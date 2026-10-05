import { sql } from '../database/db.js'

export async function create(data, db = sql) {
  const [row] = await db`insert into occasion ${db(data)} returning *`
  return row
}

export async function findById(id, db = sql) {
  const [row] = await db`
    select o.*, e.sector_id from occasion o join employee e using (registration) where o.id = ${id}`
  return row ?? null
}

/** Filtros: registration, sectorId, from, to, type */
export function findMany(f = {}, db = sql) {
  return db`
    select o.id, o.registration, e.name as employee_name, o.day, o.type, o.description,
           o.start_time, o.end_time, o.responsible, o.created_at
    from occasion o
    join employee e using (registration)
    where true
      ${f.registration ? db`and o.registration = ${f.registration}` : db``}
      ${f.sectorId ? db`and e.sector_id = ${f.sectorId}` : db``}
      ${f.from ? db`and o.day >= ${f.from}` : db``}
      ${f.to ? db`and o.day <= ${f.to}` : db``}
      ${f.type ? db`and o.type = ${f.type}` : db``}
    order by o.day, e.name`
}

export async function remove(id, db = sql) {
  await db`delete from occasion where id = ${id}`
}
