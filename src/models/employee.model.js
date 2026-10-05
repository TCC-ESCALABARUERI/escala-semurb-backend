import { sql } from '../database/db.js'

// Model = acesso a dados. Só SQL; nenhuma regra de negócio aqui.
// Todo método aceita `db` para poder participar de uma transação (sql.begin).

// Nunca devolver o hash da senha para fora da camada de dados
const PUBLIC_COLUMNS = sql`
  e.registration, e.name, e.email, e.phone, e.position, e.is_admin, e.must_change_password,
  e.sector_id, e.team_id, e.region_id, e.shift_id, e.scale_id, e.created_at, e.updated_at`

export async function findByRegistration(registration, db = sql) {
  const [row] =
    await db`select ${PUBLIC_COLUMNS} from employee e where e.registration = ${registration}`
  return row ?? null
}

export async function findCredentials(registration, db = sql) {
  const [row] = await db`
    select registration, password, is_admin, sector_id, must_change_password
    from employee where registration = ${registration}`
  return row ?? null
}

export async function findByEmail(email, db = sql) {
  const [row] = await db`
    select ${PUBLIC_COLUMNS} from employee e where lower(e.email) = lower(${email})`
  return row ?? null
}

// Visão completa do funcionário (usada em GET /me)
export async function findDetailed(registration, db = sql) {
  const [row] = await db`
    select ${PUBLIC_COLUMNS},
      case when s.id is null then null else json_build_object('id', s.id, 'name', s.name) end as sector,
      case when t.id is null then null else json_build_object('id', t.id, 'name', t.name) end as team,
      case when r.id is null then null else json_build_object('id', r.id, 'name', r.name) end as region,
      case when sc.id is null then null else json_build_object(
        'id', sc.id, 'startDate', sc.start_date, 'scaleType', sc.scale_type,
        'workDay', sc.work_day, 'unworkDay', sc.unwork_day, 'unworkScale', sc.unwork_scale,
        'useOccasions', sc.use_occasions) end as scale,
      case when sh.id is null then null else json_build_object(
        'id', sh.id, 'shiftStart', sh.shift_start, 'shiftEnd', sh.shift_end,
        'shiftPause', sh.shift_pause, 'totalShift', sh.total_shift) end as shift,
      (select json_build_object('id', c.id, 'status', c.status, 'confirmationDate', c.confirmation_date)
         from confirmation c
        where c.registration = e.registration and c.scale_id = e.scale_id) as confirmation
    from employee e
    left join sector s  on s.id  = e.sector_id
    left join team   t  on t.id  = e.team_id
    left join region r  on r.id  = e.region_id
    left join scale  sc on sc.id = e.scale_id
    left join shift  sh on sh.id = e.shift_id
    where e.registration = ${registration}`
  return row ?? null
}

export async function update(registration, data, db = sql) {
  const [row] = await db`
    update employee set ${db(data)} where registration = ${registration}
    returning registration, name, email, phone, position, is_admin, sector_id, team_id, region_id`
  return row ?? null
}

export async function updatePassword(registration, passwordHash, db = sql) {
  await db`
    update employee set password = ${passwordHash}, must_change_password = false
    where registration = ${registration}`
}

export async function countBySector(db = sql) {
  return db`
    select s.id as sector_id, coalesce(s.name, 'Sem setor') as sector_name, count(e.registration)::int as total
    from employee e
    full join sector s on s.id = e.sector_id
    group by s.id, s.name
    order by sector_name`
}
