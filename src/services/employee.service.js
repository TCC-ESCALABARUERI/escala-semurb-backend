import { sql } from '../database/db.js'
import * as Employee from '../models/employee.model.js'
import * as Team from '../models/team.model.js'
import * as Region from '../models/region.model.js'
import * as Scale from '../models/scale.model.js'
import * as Shift from '../models/shift.model.js'
import * as Confirmation from '../models/confirmation.model.js'
import { hashPassword } from '../utils/password.js'
import { ROLES } from '../utils/token.js'
import { badRequest, notFound } from '../utils/AppError.js'
import { scopedSector, loadManagedEmployee, responsibleOf } from './access.js'
import { notify } from './notification.service.js'
import { parseScaleType, buildWeeklyDaysOff, calculateShift } from './rules/scale.rules.js'

// ---------- consultas ----------

export function list(user, filters) {
  return Employee.findMany({
    ...filters,
    sectorId: scopedSector(user, filters.sectorId),
    excludeRegistration: user.registration ?? undefined
  })
}

export async function getById(user, registration) {
  await loadManagedEmployee(user, registration)
  return Employee.findDetailed(registration)
}

// ---------- validações de vínculo ----------

// Equipe precisa existir e ser do mesmo setor do funcionário
async function assertTeamInSector(teamId, sectorId, db) {
  if (!teamId) return
  const team = await Team.findById(teamId, db)
  if (!team) throw notFound('Equipe não encontrada')
  if (team.sectorId !== sectorId)
    throw badRequest('A equipe informada não pertence ao setor do funcionário')
}

async function assertRegion(regionId, db) {
  if (regionId && !(await Region.findById(regionId, db))) throw notFound('Região não encontrada')
}

// ---------- cadastro ----------

/**
 * Regras:
 *  - admin cadastra só no próprio setor e não cria outros admins;
 *  - senha inicial = matrícula, com troca obrigatória no primeiro acesso.
 */
export async function create(user, data) {
  const isMaster = user.role === ROLES.MASTER
  if (!isMaster && (data.sectorId || data.isAdmin)) {
    throw badRequest('Apenas o master define setor ou permissão de administrador')
  }
  const sectorId = scopedSector(user, data.sectorId)
  if (!sectorId) throw badRequest('Informe o setor do funcionário')

  return sql.begin(async tx => {
    await assertTeamInSector(data.teamId, sectorId, tx)
    await assertRegion(data.regionId, tx)

    const { registration } = await Employee.create(
      {
        registration: data.registration,
        name: data.name,
        email: data.email,
        phone: data.phone,
        position: data.position ?? null,
        sectorId,
        teamId: data.teamId ?? null,
        regionId: data.regionId ?? null,
        isAdmin: Boolean(data.isAdmin),
        password: await hashPassword(String(data.registration)),
        mustChangePassword: true
      },
      tx
    )

    await notify(
      registration,
      'Boas-vindas',
      'Bem-vindo ao sistema de escalas! Sua senha inicial é a sua matrícula; troque-a no primeiro acesso.',
      responsibleOf(user),
      tx
    )
    return Employee.findDetailed(registration, tx)
  })
}

// ---------- edição ----------

export async function update(user, registration, data) {
  const isMaster = user.role === ROLES.MASTER
  if (!isMaster && (data.sectorId !== undefined || data.isAdmin !== undefined)) {
    throw badRequest('Apenas o master altera setor ou permissão de administrador')
  }

  return sql.begin(async tx => {
    const current = await loadManagedEmployee(user, registration, tx)
    const sectorId = data.sectorId ?? current.sectorId

    // Mudou de setor sem informar equipe → a equipe antiga deixa de valer
    const sectorChanged = sectorId !== current.sectorId
    const teamId = data.teamId !== undefined ? data.teamId : sectorChanged ? null : current.teamId

    await assertTeamInSector(teamId, sectorId, tx)
    await assertRegion(data.regionId, tx)

    const changes = Object.fromEntries(
      Object.entries({ ...data, sectorId, teamId }).filter(([, v]) => v !== undefined)
    )
    await Employee.update(registration, changes, tx)

    await notify(
      registration,
      'Atualização de Dados',
      'Seus dados foram atualizados.',
      responsibleOf(user),
      tx
    )
    return Employee.findDetailed(registration, tx)
  })
}

// Exclui funcionário e a escala/turno que eram só dele (relação 1:1)
export function remove(user, registration) {
  return sql.begin(async tx => {
    await loadManagedEmployee(user, registration, tx)
    const removed = await Employee.remove(registration, tx)
    if (removed.scaleId) await Scale.remove(removed.scaleId, tx)
    if (removed.shiftId) await Shift.remove(removed.shiftId, tx)
  })
}

// Admin redefine a senha para a matrícula (ex.: funcionário esqueceu e não tem e-mail)
export async function resetPassword(user, registration) {
  await loadManagedEmployee(user, registration)
  await Employee.update(registration, {
    password: await hashPassword(String(registration)),
    mustChangePassword: true
  })
}

// ---------- escala ----------

/**
 * Define (cria ou substitui) a escala do funcionário.
 * Toda mudança reabre a confirmação como Pendente e notifica o funcionário.
 */
export async function setScale(user, registration, { startDate, scaleType, weeklyDaysOff }) {
  const parsed = parseScaleType(scaleType)
  const unworkScale = buildWeeklyDaysOff(parsed, weeklyDaysOff)
  const data = {
    startDate,
    scaleType,
    workDay: parsed.workDay,
    unworkDay: parsed.unworkDay,
    unworkScale
  }

  return sql.begin(async tx => {
    const employee = await loadManagedEmployee(user, registration, tx)
    const isNew = !employee.scaleId

    const scale = isNew
      ? await Scale.create(data, tx)
      : await Scale.update(employee.scaleId, data, tx)
    if (isNew) await Employee.update(registration, { scaleId: scale.id }, tx)

    const confirmation = await Confirmation.resetPending(registration, scale.id, tx)
    await notify(
      registration,
      isNew ? 'Nova Escala' : 'Atualização de Escala',
      `Escala ${scaleType} a partir de ${startDate}. Confirme o recebimento no sistema.`,
      responsibleOf(user),
      tx
    )
    return { ...scale, confirmation }
  })
}

// ---------- turno ----------

// Regra mantida do TCC: só define turno para quem já tem escala
export async function setShift(user, registration, input) {
  const data = calculateShift(input)

  return sql.begin(async tx => {
    const employee = await loadManagedEmployee(user, registration, tx)
    if (!employee.scaleId) throw badRequest('Cadastre a escala do funcionário antes do turno')

    const isNew = !employee.shiftId
    const shift = isNew
      ? await Shift.create(data, tx)
      : await Shift.update(employee.shiftId, data, tx)
    if (isNew) await Employee.update(registration, { shiftId: shift.id }, tx)

    await notify(
      registration,
      isNew ? 'Novo Turno' : 'Atualização de Turno',
      `Seu turno: ${data.shiftStart} às ${data.shiftEnd} (intervalo ${data.shiftPause}).`,
      responsibleOf(user),
      tx
    )
    return shift
  })
}
