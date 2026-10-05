import crypto from 'node:crypto'
import { sql } from '../database/db.js'
import { env } from '../config/env.js'
import * as Employee from '../models/employee.model.js'
import * as Validation from '../models/validation.model.js'
import { hashPassword, comparePassword } from '../utils/password.js'
import { signAccessToken, signResetToken, verifyToken, ROLES } from '../utils/token.js'
import { sendMail } from '../utils/mailer.js'
import { unauthorized, badRequest } from '../utils/AppError.js'

const MAX_CODE_ATTEMPTS = 5
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex')

/**
 * Login único para os 3 perfis. O papel sai do dado, não da rota:
 *  - matrícula igual à do master (.env) → master
 *  - funcionário com is_admin → admin (escopo: o próprio setor)
 *  - demais → employee
 */
export async function login({ registration, password }) {
  const { master } = env
  if (master.registration && master.passwordHash && String(registration) === master.registration) {
    if (!(await comparePassword(password, master.passwordHash)))
      throw unauthorized('Credenciais inválidas')
    return { token: signAccessToken({ registration, role: ROLES.MASTER }), role: ROLES.MASTER }
  }

  const credentials = /^\d{5}$/.test(String(registration))
    ? await Employee.findCredentials(Number(registration))
    : null
  // Mesma mensagem para matrícula inexistente e senha errada (não revela quem existe)
  if (!credentials || !(await comparePassword(password, credentials.password))) {
    throw unauthorized('Credenciais inválidas')
  }

  const role = credentials.isAdmin ? ROLES.ADMIN : ROLES.EMPLOYEE
  return {
    token: signAccessToken({
      registration: credentials.registration,
      role,
      sectorId: credentials.sectorId
    }),
    role,
    mustChangePassword: credentials.mustChangePassword
  }
}

/** Passo 1: gera código de 6 dígitos, guarda só o hash e envia por e-mail. */
export async function requestPasswordReset(email) {
  const employee = await Employee.findByEmail(email)
  // Resposta é sempre igual, exista ou não o e-mail (evita descobrir e-mails cadastrados)
  if (!employee) return

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0')
  await Validation.upsert(employee.registration, sha256(code))
  await sendMail({
    to: employee.email,
    subject: 'Escala SEMURB — código de verificação',
    html: `<p>Olá, ${employee.name}.</p><p>Seu código é <strong>${code}</strong>. Ele expira em 5 minutos.</p>`
  })
}

/** Passo 2: confere o código e troca por um token curto de redefinição. */
export async function verifyResetCode({ email, code }) {
  const invalid = badRequest('Código inválido ou expirado')
  const employee = await Employee.findByEmail(email)
  if (!employee) throw invalid

  const validation = await Validation.findByRegistration(employee.registration)
  if (!validation || validation.expiresAt < new Date() || validation.attempts >= MAX_CODE_ATTEMPTS)
    throw invalid

  if (validation.codeHash !== sha256(code)) {
    await Validation.incrementAttempts(validation.id)
    throw invalid
  }

  await Validation.removeByRegistration(employee.registration) // código é de uso único
  return { resetToken: signResetToken(employee.registration) }
}

/** Passo 3: com o token de redefinição, grava a nova senha. */
export async function resetPassword({ resetToken, password }) {
  let payload
  try {
    payload = verifyToken(resetToken, 'reset')
  } catch {
    throw badRequest('Token de redefinição inválido ou expirado')
  }
  await Employee.updatePassword(Number(payload.sub), await hashPassword(password))
}

/** Troca de senha logado: exige a senha atual. */
export async function changePassword(registration, { currentPassword, newPassword }) {
  const credentials = await Employee.findCredentials(registration)
  if (!credentials || !(await comparePassword(currentPassword, credentials.password))) {
    throw badRequest('Senha atual incorreta')
  }
  if (currentPassword === newPassword) throw badRequest('A nova senha deve ser diferente da atual')
  await sql.begin(async tx => {
    await Employee.updatePassword(registration, await hashPassword(newPassword), tx)
    await Validation.removeByRegistration(registration, tx)
  })
}
