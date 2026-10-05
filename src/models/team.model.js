import { sql } from '../database/db.js'

export async function create({ name, sectorId }, db = sql) {
  const [row] = await db`insert into team ${db({ name, sectorId })} returning *`
  return row
}
