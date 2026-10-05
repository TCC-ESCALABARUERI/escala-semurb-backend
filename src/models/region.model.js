import { sql } from '../database/db.js'

export const findAll = (db = sql) => db`
  select r.id, r.name, r.created_at,
         (select count(*)::int from employee e where e.region_id = r.id) as employee_count
  from region r order by r.name`

export async function findById(id, db = sql) {
  const [row] = await db`select * from region where id = ${id}`
  return row ?? null
}

export async function create(name, db = sql) {
  const [row] = await db`insert into region (name) values (${name}) returning *`
  return row
}

export async function update(id, name, db = sql) {
  const [row] = await db`update region set name = ${name} where id = ${id} returning *`
  return row ?? null
}

export async function remove(id, db = sql) {
  const result = await db`delete from region where id = ${id}`
  return result.count > 0
}
