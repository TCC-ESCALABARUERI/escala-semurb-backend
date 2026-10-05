import { sql } from '../database/db.js'

export async function create(data, db = sql) {
  const [row] = await db`insert into scale ${db(data)} returning *`
  return row
}

export async function update(id, data, db = sql) {
  const [row] = await db`update scale set ${db(data)} where id = ${id} returning *`
  return row
}

export async function remove(id, db = sql) {
  await db`delete from scale where id = ${id}`
}
