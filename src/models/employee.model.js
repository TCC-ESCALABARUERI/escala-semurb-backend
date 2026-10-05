import { sql } from '../database/db.js'

// Model = acesso a dados. Só SQL; nenhuma regra de negócio aqui.
// Todo método aceita `db` para poder participar de uma transação (sql.begin).

// Nunca devolver o hash da senha para fora da camada de dados
const PUBLIC_COLUMNS = sql`
  e.registration, e.name, e.email, e.phone, e.position, e.is_admin, e.must_change_password,
  e.sector_id, e.team_id, e.region_id, e.shift_id, e.scale_id, e.created_at, e.updated_at`

// Funcionário + setor, equipe, região, escala, turno e confirmação da escala atual
const DETAILED_SELECT = sql`
  select ${PUBLIC_COLUMNS},
    case when s.id is null then null else json_build_object('id', s.id, 'name', s.name) end as sector,
    case when t.id is null then null else json_build_object('id', t.id, 'name', t.name) end as team,
    case when r.id is null then null else json_build_object('id', r.id, 'name', r.name) end as region,
    case when sc.id is null then null else json_build_object(
      'id', sc.id, 'startDate', sc.start_date, 'scaleType', sc.scale_type,
      'workDay', sc.work_day, 'unworkDay', sc.unwork_day, 'unworkScale', sc.unwork_scale) end as scale,
    case when sh.id is null then null else json_build_object(
      'id', sh.id, 'shiftStart', sh.shift_start, 'shiftEnd', sh.shift_end,
      'shiftPause', sh.shift_pause, 'totalShift', sh.total_shift) end as shift,
    case when c.id is null then null else json_build_object(
      'id', c.id, 'status', c.status, 'confirmationDate', c.confirmation_date) end as confirmation
  from employee e
  left join sector s        on s.id  = e.sector_id
  left join team   t        on t.id  = e.team_id
  left join region r        on r.id  = e.region_id
  left join scale  sc       on sc.id = e.scale_id
  left join shift  sh       on sh.id = e.shift_id
  left join confirmation c  on c.registration = e.registration and c.scale_id = e.scale_id`

// Junta condições opcionais com AND
const where = conditions =>
  conditions.length ? sql`where ${conditions.reduce((acc, c) => sql`${acc} and ${c}`)}` : sql``

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

export async function findDetailed(registration, db = sql) {
  const [row] = await db`${DETAILED_SELECT} where e.registration = ${registration}`
  return row ?? null
}

/**
 * Lista com filtros opcionais.
 * @param {{ sectorId?, teamId?, regionId?, search?, excludeRegistration?, withScale?, confirmationStatus? }} f
 */
export function findMany(f = {}, db = sql) {
  const conditions = []
  if (f.sectorId) conditions.push(sql`e.sector_id = ${f.sectorId}`)
  if (f.teamId) conditions.push(sql`e.team_id = ${f.teamId}`)
  if (f.regionId) conditions.push(sql`e.region_id = ${f.regionId}`)
  if (f.excludeRegistration) conditions.push(sql`e.registration <> ${f.excludeRegistration}`)
  if (f.withScale) conditions.push(sql`e.scale_id is not null`)
  if (f.confirmationStatus) conditions.push(sql`c.status = ${f.confirmationStatus}`)
  if (f.search) {
    const term = `%${f.search}%`
    conditions.push(sql`(e.name ilike ${term} or e.registration::text like ${term})`)
  }
  return db`${DETAILED_SELECT} ${where(conditions)} order by e.name`
}

export async function create(data, db = sql) {
  const [row] = await db`insert into employee ${db(data)} returning registration`
  return row
}

export async function update(registration, data, db = sql) {
  const [row] = await db`
    update employee set ${db(data)} where registration = ${registration}
    returning registration, name, email, phone, position, is_admin, sector_id, team_id, region_id, scale_id, shift_id`
  return row ?? null
}

export async function updatePassword(registration, passwordHash, db = sql) {
  await db`
    update employee set password = ${passwordHash}, must_change_password = false
    where registration = ${registration}`
}

export async function remove(registration, db = sql) {
  const [row] = await db`
    delete from employee where registration = ${registration} returning scale_id, shift_id`
  return row ?? null
}

export const countBySector = (db = sql) => db`
  select s.id as sector_id, s.name as sector_name, count(e.registration)::int as total
  from sector s
  left join employee e on e.sector_id = s.id
  group by s.id, s.name
  order by s.name`

export const countByScaleType = (sectorId, db = sql) => db`
  select coalesce(sc.scale_type, 'Sem escala') as scale_type, count(*)::int as total
  from employee e
  left join scale sc on sc.id = e.scale_id
  ${sectorId ? db`where e.sector_id = ${sectorId}` : db``}
  group by 1
  order by 2 desc`
