import * as Employee from '../models/employee.model.js'
import { notFound, forbidden } from '../utils/AppError.js'
import { ROLES } from '../utils/token.js'

// Regras de escopo: master vê tudo; admin só o próprio setor (vindo do token).

/** Setor efetivo de uma consulta: admin é sempre travado no próprio setor. */
export const scopedSector = (user, requestedSectorId) =>
  user.role === ROLES.MASTER ? (requestedSectorId ?? null) : user.sectorId

/** Garante que o usuário pode gerenciar este setor. */
export function assertSector(user, sectorId) {
  if (user.role !== ROLES.MASTER && sectorId !== user.sectorId) {
    throw forbidden('Você só pode gerenciar o seu setor')
  }
}

/**
 * Carrega um funcionário que o usuário pode gerenciar.
 * Para admin, funcionário de outro setor responde 404 (não revela que existe).
 */
export async function loadManagedEmployee(user, registration, db) {
  const employee = await Employee.findByRegistration(registration, db)
  if (!employee || (user.role !== ROLES.MASTER && employee.sectorId !== user.sectorId)) {
    throw notFound('Funcionário não encontrado')
  }
  return employee
}

/** Matrícula do responsável pela ação (master não existe na tabela employee). */
export const responsibleOf = user => user.registration ?? null
