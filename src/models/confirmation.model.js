import { sql } from '../database/db.js'

// Cria (ou reabre como Pendente) a confirmação da escala atual do funcionário
export async function resetPending(registration, scaleId, db = sql) {
  const [row] = await db`
    insert into confirmation (registration, scale_id) values (${registration}, ${scaleId})
    on conflict (registration, scale_id)
    do update set status = 'Pendente', confirmation_date = null
    returning *`
  return row
}

export async function confirmCurrent(registration, db = sql) {
  const [row] = await db`
    update confirmation c set status = 'Confirmado', confirmation_date = now()
    from employee e
    where e.registration = ${registration}
      and c.registration = e.registration
      and c.scale_id = e.scale_id
      and c.status = 'Pendente'
    returning c.*`
  return row ?? null
}

export async function findCurrent(registration, db = sql) {
  const [row] = await db`
    select c.* from confirmation c
    join employee e on e.registration = c.registration and e.scale_id = c.scale_id
    where c.registration = ${registration}`
  return row ?? null
}
