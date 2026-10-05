import { sql } from '../database/db.js'

const SELECT = sql`
  select t.id, t.name, t.sector_id, t.created_at, t.updated_at,
         (select count(*)::int from employee e where e.team_id = t.id) as employee_count
  from team t`

export const findAll = (sectorId, db = sql) =>
  db`${SELECT} ${sectorId ? db`where t.sector_id = ${sectorId}` : db``} order by t.name`

export async function findById(id, db = sql) {
  const [row] = await db`${SELECT} where t.id = ${id}`
  return row ?? null
}

export async function create({ name, sectorId }, db = sql) {
  const [row] = await db`insert into team ${db({ name, sectorId })} returning *`
  return row
}

export async function update(id, name, db = sql) {
  const [row] = await db`update team set name = ${name} where id = ${id} returning *`
  return row ?? null
}

export async function remove(id, db = sql) {
  const result = await db`delete from team where id = ${id}`
  return result.count > 0
}
