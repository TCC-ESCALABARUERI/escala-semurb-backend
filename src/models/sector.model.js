import { sql } from '../database/db.js'

export const findAll = (db = sql) =>
  db`select id, name, created_at, updated_at from sector order by name`

export async function findById(id, db = sql) {
  const [row] = await db`select id, name, created_at, updated_at from sector where id = ${id}`
  return row ?? null
}

export async function create(name, db = sql) {
  const [row] = await db`insert into sector (name) values (${name}) returning *`
  return row
}

export async function update(id, name, db = sql) {
  const [row] = await db`update sector set name = ${name} where id = ${id} returning *`
  return row ?? null
}

export async function remove(id, db = sql) {
  const result = await db`delete from sector where id = ${id}`
  return result.count > 0
}

export async function countEmployees(id, db = sql) {
  const [{ total }] = await db`select count(*)::int as total from employee where sector_id = ${id}`
  return total
}
