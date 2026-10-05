import { sql } from '../database/db.js'

// Um código ativo por funcionário: pedir de novo substitui o anterior
export async function upsert(registration, codeHash, db = sql) {
  await db`
    insert into validation (registration, code_hash) values (${registration}, ${codeHash})
    on conflict (registration) do update
      set code_hash = excluded.code_hash, attempts = 0,
          created_at = now(), expires_at = now() + interval '5 minutes'`
}

export async function findByRegistration(registration, db = sql) {
  const [row] = await db`select * from validation where registration = ${registration}`
  return row ?? null
}

export async function incrementAttempts(id, db = sql) {
  await db`update validation set attempts = attempts + 1 where id = ${id}`
}

export async function removeByRegistration(registration, db = sql) {
  await db`delete from validation where registration = ${registration}`
}
