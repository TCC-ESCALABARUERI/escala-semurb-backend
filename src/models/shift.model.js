import { sql } from '../database/db.js'

export async function create(data, db = sql) {
  const [row] = await db`insert into shift ${db(data)} returning *`
  return row
}

export async function update(id, data, db = sql) {
  const [row] = await db`update shift set ${db(data)} where id = ${id} returning *`
  return row
}

export async function remove(id, db = sql) {
  await db`delete from shift where id = ${id}`
}
