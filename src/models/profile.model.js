import { sql } from '../database/db.js'

export async function upsert(registration, image, mimeType, db = sql) {
  await db`
    insert into profile (registration, image, mime_type) values (${registration}, ${image}, ${mimeType})
    on conflict (registration) do update set image = excluded.image, mime_type = excluded.mime_type`
}

export async function findByRegistration(registration, db = sql) {
  const [row] =
    await db`select image, mime_type, updated_at from profile where registration = ${registration}`
  return row ?? null
}

export async function remove(registration, db = sql) {
  const result = await db`delete from profile where registration = ${registration}`
  return result.count > 0
}
