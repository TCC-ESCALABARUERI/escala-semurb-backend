import { sql } from '../database/db.js'

export async function create(
  { registration, type = 'Genérica', message, responsible = null },
  db = sql
) {
  const [row] = await db`
    insert into notification ${db({ registration, type, message, responsible })} returning *`
  return row
}

export const findByEmployee = (registration, { onlyUnread = false } = {}, db = sql) => db`
  select id, type, message, responsible, is_read, send_at
  from notification
  where registration = ${registration} ${onlyUnread ? db`and is_read = false` : db``}
  order by send_at desc
  limit 100`

export async function markAsRead(id, registration, db = sql) {
  const result = await db`
    update notification set is_read = true where id = ${id} and registration = ${registration}`
  return result.count > 0
}

export async function markAllAsRead(registration, db = sql) {
  const result = await db`
    update notification set is_read = true where registration = ${registration} and is_read = false`
  return result.count
}
